import { CONFIG } from '../config/constants.js';

export async function recordAuditLog(client, channel, action, userId, username, details = {}) {
  try {
    const auditCollection = client
      .db()
      .collection(CONFIG.COLLECTION_NAMES.TRACKER_AUDIT_LOG);

    const logEntry = {
      channel,
      action,
      userId,
      username,
      timestamp: new Date(),
      details,
    };

    await auditCollection.insertOne(logEntry);
  } catch (error) {
    console.error("Failed to record audit log:", error);
  }
}

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
      timestamp: new Date(),
      details
    };

    await auditCollection.insertOne(logEntry);
  } catch (error) {
    console.error("Failed to record bank audit log:", error);
  }
}

export async function recordDecimalBankAuditLog(client, channel, action, userId, username, details = {}) {
  try {
    const auditCollection = client
      .db()
      .collection(CONFIG.COLLECTION_NAMES.BANK_AUDIT_LOG);

    const logEntry = {
      channel,
      action,
      userId,
      username,
      timestamp: new Date(),
      details,
      currencySystem: 'decimal'
    };

    await auditCollection.insertOne(logEntry);
  } catch (error) {
    console.error("Failed to record decimal bank audit log:", error);
  }
}