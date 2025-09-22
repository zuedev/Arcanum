import { MongoClient } from "mongodb";
import { PermissionFlagsBits } from "discord.js";

// ===== CONSTANTS =====

const CONFIG = {
  COLLECTION_NAMES: {
    BANK_AUDIT_LOG: "bank_audit_log",
    BANK_SETTINGS: "bank_settings",
  },
};

const ERROR_MESSAGES = {
  NO_PERMISSION: "You must have the `MANAGE_CHANNELS` permission to clear the tracker.",
  DATABASE_ERROR: "An error occurred while accessing the database.",
};

// ===== DATABASE UTILITIES =====

async function connectToDatabase() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      retryWrites: true,
      writeConcern: "majority",
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error("Database connection failed");
  }
}

async function withDatabase(operation) {
  let client = null;
  try {
    client = await connectToDatabase();
    return await operation(client);
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
}

// ===== BANK UTILITIES =====

async function migrateBankSettings(client, channel) {
  const settingsCollection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK_SETTINGS);

  // Check if settings already exist for this channel
  const existingSettings = await settingsCollection.findOne({ channel });
  if (existingSettings) {
    return; // Already migrated or settings exist
  }

  // Migrate from old bank_fees collection
  try {
    const bankFeesCollection = client.db().collection("bank_fees");
    const oldFeeConfig = await bankFeesCollection.findOne({ channel, currencySystem: "dnd" });

    // Migrate from old bank_decimal_currency_config collection
    const decimalConfigCollection = client.db().collection("bank_decimal_currency_config");
    const oldDecimalConfig = await decimalConfigCollection.findOne({ channel, currencySystem: "decimal" });

    const newSettings = {
      channel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add DND settings if they exist
    if (oldFeeConfig) {
      newSettings.currencySystem = "dnd";
      newSettings.dnd = {
        feeRate: oldFeeConfig.feeRate,
        updatedAt: oldFeeConfig.updatedAt,
        updatedBy: oldFeeConfig.updatedBy,
      };
    }

    // Add decimal settings if they exist
    if (oldDecimalConfig) {
      newSettings.currencySystem = oldDecimalConfig.currencySystem;
      newSettings.decimal = {
        prefix: oldDecimalConfig.prefix,
        suffix: oldDecimalConfig.suffix,
        prefixSpaceAfter: oldDecimalConfig.prefixSpaceAfter,
        suffixSpaceBefore: oldDecimalConfig.suffixSpaceBefore,
        updatedAt: oldDecimalConfig.updatedAt,
        updatedBy: oldDecimalConfig.updatedBy,
      };
    }

    // Insert the new settings document if there's anything to migrate
    if (oldFeeConfig || oldDecimalConfig) {
      await settingsCollection.insertOne(newSettings);
    }
  } catch (error) {
    console.error("Error during bank settings migration:", error);
    // Don't throw error, migration failure shouldn't block operations
  }
}

async function getDecimalCurrencyFormat(client, channel) {
  const settingsCollection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK_SETTINGS);

  // First, migrate any existing config documents from old collections
  await migrateBankSettings(client, channel);

  const settings = await settingsCollection.findOne({ channel, currencySystem: "decimal" });
  return {
    prefix: settings?.decimal?.prefix || "$",
    suffix: settings?.decimal?.suffix || "",
    prefixSpaceAfter: settings?.decimal?.prefixSpaceAfter || false,
    suffixSpaceBefore: settings?.decimal?.suffixSpaceBefore !== undefined ? settings.decimal.suffixSpaceBefore : true
  };
}

function formatDecimalCurrency(amount, prefix = "$", suffix = "", prefixSpaceAfter = false, suffixSpaceBefore = true) {
  const formattedAmount = amount.toFixed(2);
  const prefixPart = prefix + (prefixSpaceAfter && prefix ? " " : "");
  const suffixPart = (suffixSpaceBefore && suffix ? " " : "") + suffix;
  return `${prefixPart}${formattedAmount}${suffixPart}`;
}

async function recordDecimalBankAuditLog(client, channel, action, userId, username, details = {}) {
  try {
    const auditCollection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK_AUDIT_LOG);

    const logEntry = {
      channel,
      action,
      userId,
      username,
      currencySystem: "decimal",
      timestamp: new Date(),
      details,
    };

    await auditCollection.insertOne(logEntry);
  } catch (error) {
    console.error("Failed to record decimal bank audit log:", error);
  }
}

// ===== COMMAND HANDLER =====

/**
 * Handles decimal bank setformat subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleDecimalBankSetFormat(interaction) {
  try {
    // Check permissions
    if (
      !interaction.channel
        .permissionsFor(interaction.member)
        ?.has(PermissionFlagsBits.ManageChannels)
    ) {
      await interaction.editReply(ERROR_MESSAGES.NO_PERMISSION);
      return;
    }

    const prefix = interaction.options.getString("prefix");
    const suffix = interaction.options.getString("suffix");
    const prefixSpaceAfter = interaction.options.getBoolean("prefix_space_after");
    const suffixSpaceBefore = interaction.options.getBoolean("suffix_space_before");

    if (prefix === null && suffix === null && prefixSpaceAfter === null && suffixSpaceBefore === null) {
      await interaction.editReply("You must specify at least one formatting option.");
      return;
    }

    await withDatabase(async (client) => {
      const settingsCollection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK_SETTINGS);

      // First, migrate any existing settings from old collections
      await migrateBankSettings(client, interaction.channel.id);

      // Get current settings or use defaults
      const currentSettings = await settingsCollection.findOne({
        channel: interaction.channel.id
      });

      const currentDecimal = currentSettings?.decimal || {};

      const updateFields = {
        "decimal.prefix": prefix !== null ? prefix : (currentDecimal.prefix || "$"),
        "decimal.suffix": suffix !== null ? suffix : (currentDecimal.suffix || ""),
        "decimal.prefixSpaceAfter": prefixSpaceAfter !== null ? prefixSpaceAfter : (currentDecimal.prefixSpaceAfter || false),
        "decimal.suffixSpaceBefore": suffixSpaceBefore !== null ? suffixSpaceBefore : (currentDecimal.suffixSpaceBefore !== undefined ? currentDecimal.suffixSpaceBefore : true),
        "decimal.updatedAt": new Date(),
        "decimal.updatedBy": interaction.user.id,
        updatedAt: new Date(),
      };

      await settingsCollection.findOneAndUpdate(
        { channel: interaction.channel.id },
        {
          $set: updateFields,
          $setOnInsert: {
            channel: interaction.channel.id,
            currencySystem: "decimal",
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Record audit log
      await recordDecimalBankAuditLog(
        client,
        interaction.channel.id,
        "setformat",
        interaction.user.id,
        interaction.user.username,
        {
          newPrefix: prefix,
          newSuffix: suffix,
          newPrefixSpaceAfter: prefixSpaceAfter,
          newSuffixSpaceBefore: suffixSpaceBefore,
        }
      );

      const format = await getDecimalCurrencyFormat(client, interaction.channel.id);
      const example = formatDecimalCurrency(123.45, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore);
      await interaction.editReply(
        `Updated decimal currency format. Example: ${example}`
      );
    });
  } catch (error) {
    console.error("Error in decimal bank setformat:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}

export { handleDecimalBankSetFormat };