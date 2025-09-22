import { CONFIG, CURRENCY_ABBREVIATIONS } from './config.js';
import { validateCurrency, validateNumber } from './utils.js';
import { performBankDeposit, performBankWithdrawal, recordAuditLog, withDatabase } from '../../../database/operations.js';
import { handleBankError } from '../../../utils/errorHandlers.js';

/**
 * Handles DND bank deposit with shared operations
 * @param {Object} interaction - Discord interaction
 */
export async function handleDndBankDeposit(interaction) {
  try {
    const rawCurrency = interaction.options.getString("currency");
    const amount = interaction.options.getInteger("amount");

    const currency = validateCurrency(rawCurrency);
    validateNumber(amount, 1);

    await withDatabase(async (client) => {
      const updateResult = await performBankDeposit(
        {
          channel: interaction.channel.id,
          currency,
          currencySystem: "dnd",
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
          currencySystem: "dnd",
          details: { currency, amount, oldAmount, newAmount: updateResult.amount },
        },
        client,
        CONFIG.COLLECTION_NAMES.BANK_AUDIT_LOG
      );

      await interaction.editReply(
        `Deposited \`${amount}\` **${currency}** (${CURRENCY_ABBREVIATIONS[currency]}). Balance: \`${oldAmount}\` → \`${updateResult.amount}\` ${CURRENCY_ABBREVIATIONS[currency]}.`
      );
    });
  } catch (error) {
    await handleBankError(error, interaction, "deposit");
  }
}

/**
 * Handles DND bank withdrawal with shared operations
 * @param {Object} interaction - Discord interaction
 */
export async function handleDndBankWithdraw(interaction) {
  try {
    const rawCurrency = interaction.options.getString("currency");
    const amount = interaction.options.getInteger("amount");

    const currency = validateCurrency(rawCurrency);
    validateNumber(amount, 1);

    await withDatabase(async (client) => {
      const { existingEntry, updateResult } = await performBankWithdrawal(
        {
          channel: interaction.channel.id,
          currency,
          currencySystem: "dnd",
          amount
        },
        client,
        CONFIG.COLLECTION_NAMES.BANK
      );

      if (!updateResult) {
        const currentAmount = existingEntry?.amount || 0;
        await interaction.editReply(
          `Insufficient **${currency}** balance. Available: \`${currentAmount}\` ${CURRENCY_ABBREVIATIONS[currency]}, requested: \`${amount}\` ${CURRENCY_ABBREVIATIONS[currency]}.`
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
          currencySystem: "dnd",
          details: { currency, amount, oldAmount, newAmount: updateResult.amount },
        },
        client,
        CONFIG.COLLECTION_NAMES.BANK_AUDIT_LOG
      );

      const message = isWithdrawAll
        ? `Withdrew \`${amount}\` **${currency}** (${CURRENCY_ABBREVIATIONS[currency]}). Balance: \`${oldAmount}\` → \`0\` ${CURRENCY_ABBREVIATIONS[currency]}. Currency removed from bank.`
        : `Withdrew \`${amount}\` **${currency}** (${CURRENCY_ABBREVIATIONS[currency]}). Balance: \`${oldAmount}\` → \`${updateResult.amount}\` ${CURRENCY_ABBREVIATIONS[currency]}.`;

      await interaction.editReply(message);
    });
  } catch (error) {
    await handleBankError(error, interaction, "withdraw");
  }
}