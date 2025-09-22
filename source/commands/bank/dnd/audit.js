import { CONFIG, CURRENCY_ABBREVIATIONS, ERROR_MESSAGES } from '../shared/config.js';
import { withDatabase } from '../shared/utils.js';

/**
 * Formats a bank audit action into human-readable text
 * @param {string} action - The action type
 * @param {Object} details - Action details
 * @returns {string} Formatted action text
 */
export function formatBankAuditAction(action, details) {
  const abbrev = CURRENCY_ABBREVIATIONS[details.currency] || "";

  switch (action) {
    case "deposit":
      return `deposited ${details.amount} **${details.currency}** (${details.oldAmount} → ${details.newAmount} ${abbrev})`;
    case "withdraw":
      return `withdrew ${details.amount} **${details.currency}** (${details.oldAmount} → ${details.newAmount} ${abbrev})`;
    case "withdraw_all":
      return `withdrew all **${details.currency}** (${details.oldAmount} → 0 ${abbrev})`;
    case "clear":
      return `cleared ${details.totalCurrenciesCleared} currenc${details.totalCurrenciesCleared === 1 ? 'y' : 'ies'} from bank`;
    case "convert":
      return `converted ${details.fromAmount} **${details.fromCurrency}** → ${details.toAmount} **${details.toCurrency}** (fee: ${details.feeAmount} ${CURRENCY_ABBREVIATIONS[details.fromCurrency]})`;
    case "setfee":
      return `set conversion fee rate to ${details.feePercentage}%`;
    default:
      return `performed action: ${action}`;
  }
}

/**
 * Handles bank audit subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankAudit(interaction) {
  try {
    const limit = interaction.options.getInteger("limit") || 20;

    await withDatabase(async (client) => {
      const auditCollection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.BANK_AUDIT_LOG);

      // First, update any existing audit documents that don't have currencySystem field
      await auditCollection.updateMany(
        { channel: interaction.channel.id, currencySystem: { $exists: false } },
        { $set: { currencySystem: "dnd" } }
      );

      const auditEntries = await auditCollection
        .find({ channel: interaction.channel.id, $or: [{ currencySystem: "dnd" }, { currencySystem: { $exists: false } }] })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      if (!auditEntries.length) {
        await interaction.editReply("No bank audit log entries found for this channel.");
        return;
      }

      let message = `**Bank Audit Log** (${auditEntries.length} recent entries):\n\n`;

      for (const entry of auditEntries.reverse()) {
        const timestamp = entry.timestamp.toLocaleString();
        const actionText = formatBankAuditAction(entry.action, entry.details);
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
          content: `**Bank Audit Log** (${auditEntries.length} recent entries)\n\nThe audit log is too large to display, here is a JSON file instead.`,
          files: [
            {
              attachment: Buffer.from(JSON.stringify(auditData, null, 2), "utf8"),
              name: `bank-audit-${interaction.channel.id}.json`,
            },
          ],
        });
      } else {
        await interaction.editReply(message);
      }
    });
  } catch (error) {
    console.error("Error in bank audit:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}