import { MongoClient } from "mongodb";

// ===== CONSTANTS =====

const CONFIG = {
  COLLECTION_NAMES: {
    BANK: "bank",
    BANK_AUDIT_LOG: "bank_audit_log",
    BANK_SETTINGS: "bank_settings",
  },
};

const ERROR_MESSAGES = {
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
 * Handles decimal bank withdraw subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleDecimalBankWithdraw(interaction) {
  try {
    const amount = parseFloat(interaction.options.getNumber("amount"));

    if (amount <= 0) {
      await interaction.editReply("Amount must be greater than 0.");
      return;
    }

    await withDatabase(async (client) => {
      const collection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK);
      const format = await getDecimalCurrencyFormat(client, interaction.channel.id);

      // Check if account exists and has sufficient balance
      const existingEntry = await collection.findOne({
        channel: interaction.channel.id,
        currency: "decimal",
        currencySystem: "decimal",
      });

      if (!existingEntry || existingEntry.amount < amount) {
        const currentAmount = existingEntry?.amount || 0;
        await interaction.editReply(
          `Insufficient balance. Available: ${formatDecimalCurrency(currentAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}, requested: ${formatDecimalCurrency(amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}.`
        );
        return;
      }

      const updateResult = await collection.findOneAndUpdate(
        { channel: interaction.channel.id, currency: "decimal", currencySystem: "decimal" },
        {
          $inc: { amount: -amount },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );

      const oldAmount = updateResult.amount + amount;

      // Record audit log
      await recordDecimalBankAuditLog(
        client,
        interaction.channel.id,
        updateResult.amount <= 0 ? "withdraw_all" : "withdraw",
        interaction.user.id,
        interaction.user.username,
        {
          amount,
          oldAmount,
          newAmount: updateResult.amount,
        }
      );

      if (updateResult.amount <= 0) {
        await collection.deleteOne({ channel: interaction.channel.id, currency: "decimal", currencySystem: "decimal" });
        await interaction.editReply(
          `Withdrew ${formatDecimalCurrency(amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}. Balance: ${formatDecimalCurrency(oldAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} → ${formatDecimalCurrency(0, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}. Account cleared.`
        );
      } else {
        await interaction.editReply(
          `Withdrew ${formatDecimalCurrency(amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}. Balance: ${formatDecimalCurrency(oldAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} → ${formatDecimalCurrency(updateResult.amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}.`
        );
      }
    });
  } catch (error) {
    console.error("Error in decimal bank withdraw:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}

export { handleDecimalBankWithdraw };