import { MongoClient } from "mongodb";

/**
 * Database operations utilities following DRY principles
 */

const CONNECTION_CONFIG = {
  retryWrites: true,
  writeConcern: "majority",
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Connects to MongoDB with optimized settings
 * @returns {Promise<MongoClient>} Connected MongoDB client
 * @throws {Error} If connection fails
 */
export async function connectToDatabase() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, CONNECTION_CONFIG);
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
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
}

/**
 * Generic bank deposit operation
 * @param {Object} params - Operation parameters
 * @param {string} params.channel - Channel ID
 * @param {string} params.currency - Currency type
 * @param {string} params.currencySystem - Currency system (dnd/decimal)
 * @param {number} params.amount - Amount to deposit
 * @param {MongoClient} client - Database client
 * @param {string} collectionName - Collection name to use
 * @returns {Promise<Object>} Update result
 */
export async function performBankDeposit({ channel, currency, currencySystem, amount }, client, collectionName) {
  const collection = client.db().collection(collectionName);

  return await collection.findOneAndUpdate(
    { channel, currency, currencySystem },
    {
      $inc: { amount },
      $setOnInsert: {
        channel,
        currency,
        currencySystem,
        createdAt: new Date(),
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true, returnDocument: "after" }
  );
}

/**
 * Generic bank withdrawal operation
 * @param {Object} params - Operation parameters
 * @param {string} params.channel - Channel ID
 * @param {string} params.currency - Currency type
 * @param {string} params.currencySystem - Currency system (dnd/decimal)
 * @param {number} params.amount - Amount to withdraw
 * @param {MongoClient} client - Database client
 * @param {string} collectionName - Collection name to use
 * @returns {Promise<Object>} Update result and existing entry
 */
export async function performBankWithdrawal({ channel, currency, currencySystem, amount }, client, collectionName) {
  const collection = client.db().collection(collectionName);

  // Check existing balance
  const existingEntry = await collection.findOne({ channel, currency, currencySystem });

  if (!existingEntry || existingEntry.amount < amount) {
    return { existingEntry, updateResult: null };
  }

  const updateResult = await collection.findOneAndUpdate(
    { channel, currency, currencySystem },
    {
      $inc: { amount: -amount },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" }
  );

  // Remove entry if balance is zero or negative
  if (updateResult.amount <= 0) {
    await collection.deleteOne({ channel, currency, currencySystem });
  }

  return { existingEntry, updateResult };
}

/**
 * Records audit log entry
 * @param {Object} params - Log parameters
 * @param {string} params.channel - Channel ID
 * @param {string} params.action - Action performed
 * @param {string} params.userId - User ID
 * @param {string} params.username - Username
 * @param {string} params.currencySystem - Currency system
 * @param {Object} params.details - Additional details
 * @param {MongoClient} client - Database client
 * @param {string} collectionName - Audit collection name
 */
export async function recordAuditLog({ channel, action, userId, username, currencySystem, details }, client, collectionName) {
  try {
    const auditCollection = client.db().collection(collectionName);

    const logEntry = {
      channel,
      action,
      userId,
      username,
      currencySystem,
      timestamp: new Date(),
      details,
    };

    await auditCollection.insertOne(logEntry);
  } catch (error) {
    console.error(`Failed to record audit log for ${currencySystem}:`, error);
  }
}