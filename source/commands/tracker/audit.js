import { CONFIG, ERROR_MESSAGES } from '../../config/constants.js';
import { withDatabase } from '../../database/connection.js';

/**
 * Formats an audit action into human-readable text
 * @param {string} action - The action type
 * @param {Object} details - Action details
 * @returns {string} Formatted action text
 */
function formatAuditAction(action, details) {
  switch (action) {
    case "add":
      return `added ${details.quantityChanged} **${details.itemName}** (${details.oldQuantity} → ${details.newQuantity})`;
    case "remove":
      return `removed ${details.quantityChanged} **${details.itemName}** (${details.oldQuantity} → ${details.newQuantity})`;
    case "remove_all":
      return `removed all **${details.itemName}** (${details.oldQuantity} → 0)`;
    case "clear":
      return `cleared ${details.totalItemsCleared} item${details.totalItemsCleared === 1 ? '' : 's'} from tracker`;
    case "rename":
      return `renamed **${details.oldName}** to **${details.newName}**`;
    case "rename_merge":
      return `renamed **${details.oldName}** to **${details.newName}** and merged quantities (${details.oldQuantity} + ${details.mergedWithQuantity} = ${details.totalQuantity})`;
    default:
      return `performed action: ${action}`;
  }
}

/**
 * Handles tracker audit subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleTrackerAudit(interaction) {
  try {
    const limit = interaction.options.getInteger("limit") || 20;

    await withDatabase(async (client) => {
      const auditCollection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.TRACKER_AUDIT_LOG);

      const auditEntries = await auditCollection
        .find({ channel: interaction.channel.id })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      if (!auditEntries.length) {
        await interaction.editReply("No audit log entries found for this channel.");
        return;
      }

      let message = `**Tracker Audit Log** (${auditEntries.length} recent entries):\n\n`;

      for (const entry of auditEntries.reverse()) {
        const timestamp = entry.timestamp.toLocaleString();
        const actionText = formatAuditAction(entry.action, entry.details);
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
          content: `**Tracker Audit Log** (${auditEntries.length} recent entries)\n\nThe audit log is too large to display, here is a JSON file instead.`,
          files: [
            {
              attachment: Buffer.from(JSON.stringify(auditData, null, 2), "utf8"),
              name: `tracker-audit-${interaction.channel.id}.json`,
            },
          ],
        });
      } else {
        await interaction.editReply(message);
      }
    });
  } catch (error) {
    console.error("Error in tracker audit:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}