import { MongoClient } from "mongodb";

// ===== CONSTANTS =====

const CONFIG = {
  COLLECTION_NAMES: {
    BANK_AUDIT_LOG: "bank_audit_log",
    BANK_SETTINGS: "bank_settings",
  },
  TRACKER_MESSAGE_LIMIT: 1900,
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

// ===== HELPER FUNCTIONS =====

/**
 * Formats a decimal bank audit action into human-readable text
 * @param {MongoClient} client - MongoDB client
 * @param {string} channel - Channel ID
 * @param {string} action - The action type
 * @param {Object} details - Action details
 * @returns {Promise<string>} Formatted action text
 */
async function formatDecimalBankAuditAction(client, channel, action, details) {
  const format = await getDecimalCurrencyFormat(client, channel);

  switch (action) {
    case "deposit":
      return `deposited ${formatDecimalCurrency(details.amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} (${formatDecimalCurrency(details.oldAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} → ${formatDecimalCurrency(details.newAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)})`;
    case "withdraw":
      return `withdrew ${formatDecimalCurrency(details.amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} (${formatDecimalCurrency(details.oldAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} → ${formatDecimalCurrency(details.newAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)})`;
    case "withdraw_all":
      return `withdrew all funds (${formatDecimalCurrency(details.oldAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} → ${formatDecimalCurrency(0, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)})`;
    case "clear":
      return `cleared account (${formatDecimalCurrency(details.clearedAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} → ${formatDecimalCurrency(0, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)})`;
    case "setformat":
      const formatParts = [];
      if (details.newPrefix !== undefined) formatParts.push(`prefix: '${details.newPrefix || ''}'`);
      if (details.newSuffix !== undefined) formatParts.push(`suffix: '${details.newSuffix || ''}'`);
      if (details.newPrefixSpaceAfter !== undefined) formatParts.push(`prefix space: ${details.newPrefixSpaceAfter ? 'on' : 'off'}`);
      if (details.newSuffixSpaceBefore !== undefined) formatParts.push(`suffix space: ${details.newSuffixSpaceBefore ? 'on' : 'off'}`);
      return `set currency format (${formatParts.join(', ')})`;
    default:
      return `performed action: ${action}`;
  }
}

// ===== COMMAND HANDLER =====

/**
 * Handles decimal bank audit subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleDecimalBankAudit(interaction) {
  try {
    const limit = interaction.options.getInteger("limit") || 20;

    await withDatabase(async (client) => {
      const auditCollection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK_AUDIT_LOG);

      // First, update any existing audit documents that don't have currencySystem field
      await auditCollection.updateMany(
        { channel: interaction.channel.id, currencySystem: { $exists: false } },
        { $set: { currencySystem: "decimal" } }
      );

      const auditEntries = await auditCollection
        .find({ channel: interaction.channel.id, currencySystem: "decimal" })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      if (!auditEntries.length) {
        await interaction.editReply("No decimal bank audit log entries found for this channel.");
        return;
      }

      let message = `**Decimal Bank Audit Log** (${auditEntries.length} recent entries):\n\n`;

      for (const entry of auditEntries.reverse()) {
        const timestamp = entry.timestamp.toLocaleString();
        const actionText = await formatDecimalBankAuditAction(client, interaction.channel.id, entry.action, entry.details);
        message += `**${timestamp}** - <@${entry.userId}> ${actionText}\n`;
      }

      if (message.length > CONFIG.TRACKER_MESSAGE_LIMIT) {
        // Create detailed JSON file for large audit logs
        const auditData = auditEntries.map(entry => ({
          timestamp: entry.timestamp.toISOString(),
          user: entry.username,
          action: entry.action,
          details: entry.details
        }));

        await interaction.editReply({
          content: `**Decimal Bank Audit Log** (${auditEntries.length} recent entries)\n\nThe audit log is too large to display, here is a JSON file instead.`,
          files: [
            {
              attachment: Buffer.from(JSON.stringify(auditData, null, 2), "utf8"),
              name: `decimal-bank-audit-${interaction.channel.id}.json`,
            },
          ],
        });
      } else {
        await interaction.editReply(message);
      }
    });
  } catch (error) {
    console.error("Error in decimal bank audit:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}

export { handleDecimalBankAudit, formatDecimalBankAuditAction };