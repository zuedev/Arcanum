import { MongoClient } from "mongodb";
import { CONFIG, CURRENCY_TYPES, CURRENCY_ABBREVIATIONS, DEFAULT_CONVERSION_FEE } from './config.js';

/**
 * Connects to MongoDB with optimized settings
 * @returns {Promise<MongoClient>} Connected MongoDB client
 * @throws {Error} If connection fails
 */
export async function connectToDatabase() {
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

/**
 * Safely executes database operations with proper connection management
 * @param {Function} operation - Async function that performs database operations
 * @returns {Promise<any>} Result of the database operation
 */
export async function withDatabase(operation) {
  let client = null;
  try {
    client = await connectToDatabase();
    return await operation(client);
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Validates currency input
 * @param {string} currency - Currency to validate
 * @returns {string} Validated and normalized currency
 * @throws {Error} If currency is invalid
 */
export function validateCurrency(currency) {
  if (typeof currency !== "string") {
    throw new Error("Currency must be a string");
  }

  const normalizedCurrency = currency.toLowerCase().trim();

  if (!CURRENCY_TYPES.includes(normalizedCurrency)) {
    throw new Error(`Invalid currency type. Valid currencies are: ${CURRENCY_TYPES.map(c => `${c} (${CURRENCY_ABBREVIATIONS[c]})`).join(", ")}.`);
  }

  return normalizedCurrency;
}

/**
 * Validates fee rate input
 * @param {number} feeRate - Fee rate to validate (0-1)
 * @returns {number} Validated fee rate
 * @throws {Error} If fee rate is invalid
 */
export function validateFeeRate(feeRate) {
  if (typeof feeRate !== "number" || isNaN(feeRate) || feeRate < 0 || feeRate > 1) {
    throw new Error("Fee rate must be a number between 0 and 1 (0% to 100%).");
  }
  return feeRate;
}

/**
 * Validates numeric input
 * @param {number} value - Number to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Validated number
 * @throws {Error} If value is invalid
 */
export function validateNumber(value, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Value must be an integer between ${min} and ${max}`);
  }
  return value;
}

/**
 * Records an audit log entry for bank changes
 * @param {MongoClient} client - MongoDB client
 * @param {string} channel - Channel ID
 * @param {string} action - Action performed
 * @param {string} userId - User ID who performed the action
 * @param {string} username - Username who performed the action
 * @param {Object} details - Additional details about the action
 */
export async function recordBankAuditLog(client, channel, action, userId, username, details = {}) {
  try {
    const auditCollection = client
      .db()
      .collection(CONFIG.COLLECTION_NAMES.BANK_AUDIT_LOG);

    const logEntry = {
      channel,
      action,
      userId,
      username,
      currencySystem: "dnd",
      timestamp: new Date(),
      details,
    };

    await auditCollection.insertOne(logEntry);
  } catch (error) {
    console.error("Failed to record bank audit log:", error);
  }
}

/**
 * Migrates bank settings from old collections
 * @param {MongoClient} client - MongoDB client
 * @param {string} channel - Channel ID
 */
export async function migrateBankSettings(client, channel) {
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
      if (!newSettings.currencySystem) {
        newSettings.currencySystem = "decimal";
      }
      newSettings.decimal = {
        prefix: oldDecimalConfig.prefix,
        suffix: oldDecimalConfig.suffix,
        prefixSpaceAfter: oldDecimalConfig.prefixSpaceAfter,
        suffixSpaceBefore: oldDecimalConfig.suffixSpaceBefore,
        updatedAt: oldDecimalConfig.updatedAt,
        updatedBy: oldDecimalConfig.updatedBy,
      };
    }

    // Only create settings document if we have something to migrate
    if (oldFeeConfig || oldDecimalConfig) {
      await settingsCollection.insertOne(newSettings);
    }
  } catch (error) {
    // Migration failed, but continue - settings will use defaults
    console.warn(`Failed to migrate bank settings for channel ${channel}:`, error);
  }
}

/**
 * Gets bank fee rate for DND currency conversions
 * @param {MongoClient} client - MongoDB client
 * @param {string} channel - Channel ID
 * @returns {Promise<number>} Fee rate (0-1)
 */
export async function getBankFeeRate(client, channel) {
  const settingsCollection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK_SETTINGS);

  // First, migrate any existing settings from old collections
  await migrateBankSettings(client, channel);

  const settings = await settingsCollection.findOne({ channel, currencySystem: "dnd" });
  return settings?.dnd?.feeRate || DEFAULT_CONVERSION_FEE;
}