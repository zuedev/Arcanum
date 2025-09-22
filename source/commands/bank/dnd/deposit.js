import { CONFIG, CURRENCY_ABBREVIATIONS, ERROR_MESSAGES } from '../shared/config.js';
import { validateCurrency, validateNumber, withDatabase, recordBankAuditLog } from '../shared/utils.js';

/**
 * Handles bank deposit subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankDeposit(interaction) {
  try {
    const rawCurrency = interaction.options.getString("currency");
    const amount = interaction.options.getInteger("amount");

    const currency = validateCurrency(rawCurrency);
    validateNumber(amount, 1);

    await withDatabase(async (client) => {
      const collection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.BANK);

      const updateResult = await collection.findOneAndUpdate(
        { channel: interaction.channel.id, currency, currencySystem: "dnd" },
        {
          $inc: { amount },
          $setOnInsert: {
            channel: interaction.channel.id,
            currency,
            currencySystem: "dnd",
            createdAt: new Date(),
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, returnDocument: "after" }
      );

      const oldAmount = updateResult.amount - amount;

      // Record audit log
      await recordBankAuditLog(
        client,
        interaction.channel.id,
        "deposit",
        interaction.user.id,
        interaction.user.username,
        {
          currency,
          amount,
          oldAmount,
          newAmount: updateResult.amount,
        }
      );

      await interaction.editReply(
        `Deposited \`${amount}\` **${currency}** (${CURRENCY_ABBREVIATIONS[currency]}). Balance: \`${oldAmount}\` → \`${updateResult.amount}\` ${CURRENCY_ABBREVIATIONS[currency]}.`
      );
    });
  } catch (error) {
    console.error("Error in bank deposit:", error);

    if (error.message.includes("currency")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_CURRENCY);
    } else if (error.message.includes("integer")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_QUANTITY);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}