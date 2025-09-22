import { CONFIG } from './config.js';
import { migrateBankSettings } from './utils.js';
import { performBankDeposit, performBankWithdrawal, recordAuditLog, withDatabase } from '../../../database/operations.js';
import { handleBankError } from '../../../utils/errorHandlers.js';

/**
 * Gets decimal currency format configuration
 * @param {MongoClient} client - Database client
 * @param {string} channel - Channel ID
 * @returns {Promise<Object>} Format configuration
 */
export async function getDecimalCurrencyFormat(client, channel) {
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

/**
 * Formats decimal currency amount
 * @param {number} amount - Amount to format
 * @param {string} prefix - Currency prefix
 * @param {string} suffix - Currency suffix
 * @param {boolean} prefixSpaceAfter - Add space after prefix
 * @param {boolean} suffixSpaceBefore - Add space before suffix
 * @returns {string} Formatted currency string
 */
export function formatDecimalCurrency(amount, prefix = "$", suffix = "", prefixSpaceAfter = false, suffixSpaceBefore = true) {
  const formattedAmount = amount.toFixed(2);
  const prefixPart = prefix + (prefixSpaceAfter && prefix ? " " : "");
  const suffixPart = (suffixSpaceBefore && suffix ? " " : "") + suffix;
  return `${prefixPart}${formattedAmount}${suffixPart}`;
}

/**
 * Validates decimal amount
 * @param {number} amount - Amount to validate
 * @throws {Error} If amount is invalid
 */
function validateDecimalAmount(amount) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0.");
  }
}

/**
 * Handles decimal bank deposit with shared operations
 * @param {Object} interaction - Discord interaction
 */
export async function handleDecimalBankDeposit(interaction) {
  try {
    const amount = parseFloat(interaction.options.getNumber("amount"));
    validateDecimalAmount(amount);

    await withDatabase(async (client) => {
      const format = await getDecimalCurrencyFormat(client, interaction.channel.id);

      const updateResult = await performBankDeposit(
        {
          channel: interaction.channel.id,
          currency: "decimal",
          currencySystem: "decimal",
          amount
        },
        client,
        CONFIG.COLLECTION_NAMES.BANK
      );

      const oldAmount = updateResult.amount - amount;

      await recordAuditLog(
        {
          channel: interaction.channel.id,
          action: "deposit",
          userId: interaction.user.id,
          username: interaction.user.username,
          currencySystem: "decimal",
          details: { amount, oldAmount, newAmount: updateResult.amount },
        },
        client,
        CONFIG.COLLECTION_NAMES.BANK_AUDIT_LOG
      );

      await interaction.editReply(
        `Deposited ${formatDecimalCurrency(amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}. Balance: ${formatDecimalCurrency(oldAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} → ${formatDecimalCurrency(updateResult.amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}.`
      );
    });
  } catch (error) {
    await handleBankError(error, interaction, "deposit");
  }
}

/**
 * Handles decimal bank withdrawal with shared operations
 * @param {Object} interaction - Discord interaction
 */
export async function handleDecimalBankWithdraw(interaction) {
  try {
    const amount = parseFloat(interaction.options.getNumber("amount"));
    validateDecimalAmount(amount);

    await withDatabase(async (client) => {
      const format = await getDecimalCurrencyFormat(client, interaction.channel.id);

      const { existingEntry, updateResult } = await performBankWithdrawal(
        {
          channel: interaction.channel.id,
          currency: "decimal",
          currencySystem: "decimal",
          amount
        },
        client,
        CONFIG.COLLECTION_NAMES.BANK
      );

      if (!updateResult) {
        const currentAmount = existingEntry?.amount || 0;
        await interaction.editReply(
          `Insufficient balance. Available: ${formatDecimalCurrency(currentAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}, requested: ${formatDecimalCurrency(amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}.`
        );
        return;
      }

      const oldAmount = updateResult.amount + amount;
      const isWithdrawAll = updateResult.amount <= 0;

      await recordAuditLog(
        {
          channel: interaction.channel.id,
          action: isWithdrawAll ? "withdraw_all" : "withdraw",
          userId: interaction.user.id,
          username: interaction.user.username,
          currencySystem: "decimal",
          details: { amount, oldAmount, newAmount: updateResult.amount },
        },
        client,
        CONFIG.COLLECTION_NAMES.BANK_AUDIT_LOG
      );

      const message = isWithdrawAll
        ? `Withdrew ${formatDecimalCurrency(amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}. Balance: ${formatDecimalCurrency(oldAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} → ${formatDecimalCurrency(0, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}. Account cleared.`
        : `Withdrew ${formatDecimalCurrency(amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}. Balance: ${formatDecimalCurrency(oldAmount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)} → ${formatDecimalCurrency(updateResult.amount, format.prefix, format.suffix, format.prefixSpaceAfter, format.suffixSpaceBefore)}.`;

      await interaction.editReply(message);
    });
  } catch (error) {
    await handleBankError(error, interaction, "withdraw");
  }
}