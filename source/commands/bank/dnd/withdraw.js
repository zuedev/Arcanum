import { CONFIG, CURRENCY_ABBREVIATIONS, ERROR_MESSAGES } from '../shared/config.js';
import { validateCurrency, validateNumber, withDatabase, recordBankAuditLog } from '../shared/utils.js';

/**
 * Handles bank withdraw subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankWithdraw(interaction) {
  try {
    const rawCurrency = interaction.options.getString("currency");
    const amount = interaction.options.getInteger("amount");

    const currency = validateCurrency(rawCurrency);
    validateNumber(amount, 1);

    await withDatabase(async (client) => {
      const collection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.BANK);

      // Check if currency exists and has sufficient balance
      const existingEntry = await collection.findOne({
        channel: interaction.channel.id,
        currency,
        currencySystem: "dnd",
      });

      if (!existingEntry || existingEntry.amount < amount) {
        const currentAmount = existingEntry?.amount || 0;
        await interaction.editReply(
          `Insufficient **${currency}** balance. Available: \`${currentAmount}\` ${CURRENCY_ABBREVIATIONS[currency]}, requested: \`${amount}\` ${CURRENCY_ABBREVIATIONS[currency]}.`
        );
        return;
      }

      const updateResult = await collection.findOneAndUpdate(
        { channel: interaction.channel.id, currency, currencySystem: "dnd" },
        {
          $inc: { amount: -amount },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );

      const oldAmount = updateResult.amount + amount;

      // Record audit log
      await recordBankAuditLog(
        client,
        interaction.channel.id,
        updateResult.amount <= 0 ? "withdraw_all" : "withdraw",
        interaction.user.id,
        interaction.user.username,
        {
          currency,
          amount,
          oldAmount,
          newAmount: updateResult.amount,
        }
      );

      if (updateResult.amount <= 0) {
        await collection.deleteOne({ channel: interaction.channel.id, currency, currencySystem: "dnd" });
        await interaction.editReply(
          `Withdrew \`${amount}\` **${currency}** (${CURRENCY_ABBREVIATIONS[currency]}). Balance: \`${oldAmount}\` → \`0\` ${CURRENCY_ABBREVIATIONS[currency]}. Currency removed from bank.`
        );
      } else {
        await interaction.editReply(
          `Withdrew \`${amount}\` **${currency}** (${CURRENCY_ABBREVIATIONS[currency]}). Balance: \`${oldAmount}\` → \`${updateResult.amount}\` ${CURRENCY_ABBREVIATIONS[currency]}.`
        );
      }
    });
  } catch (error) {
    console.error("Error in bank withdraw:", error);

    if (error.message.includes("currency")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_CURRENCY);
    } else if (error.message.includes("integer")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_QUANTITY);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}