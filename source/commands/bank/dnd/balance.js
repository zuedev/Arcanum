import { CONFIG, CURRENCY_TYPES, CURRENCY_ABBREVIATIONS, CURRENCY_TO_GOLD_CONVERSION, ERROR_MESSAGES } from '../shared/config.js';
import { withDatabase } from '../shared/utils.js';

/**
 * Handles bank balance subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankBalance(interaction) {
  try {
    await withDatabase(async (client) => {
      const collection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.BANK);

      // First, update any existing documents that don't have currencySystem field
      await collection.updateMany(
        { channel: interaction.channel.id, currencySystem: { $exists: false } },
        { $set: { currencySystem: "dnd" } }
      );

      const currencies = await collection
        .find({ channel: interaction.channel.id, currencySystem: "dnd" })
        .sort({ currency: 1 })
        .toArray();

      if (!currencies.length) {
        await interaction.editReply(ERROR_MESSAGES.BANK_EMPTY);
        return;
      }

      // Calculate total pieces and total gold value
      const totalPieces = currencies.reduce((sum, entry) => sum + entry.amount, 0);
      const totalGoldValue = currencies.reduce((sum, entry) => {
        return sum + (entry.amount * CURRENCY_TO_GOLD_CONVERSION[entry.currency]);
      }, 0);

      // Format total gold value with appropriate precision
      const formattedTotalGold = totalGoldValue % 1 === 0
        ? totalGoldValue.toString()
        : totalGoldValue.toFixed(2);

      const header = `**Bank Balance** (${currencies.length} currencies, ${totalPieces} total pieces, ${formattedTotalGold} total gold):\n\n`;

      // Sort currencies by the order defined in CURRENCY_TYPES
      const sortedCurrencies = currencies.sort((a, b) => {
        return CURRENCY_TYPES.indexOf(a.currency) - CURRENCY_TYPES.indexOf(b.currency);
      });

      const currencyList = sortedCurrencies
        .map(entry => {
          const goldValue = entry.amount * CURRENCY_TO_GOLD_CONVERSION[entry.currency];
          const formattedGoldValue = goldValue % 1 === 0 ? goldValue.toString() : goldValue.toFixed(2);
          return `**${entry.currency}**: ${entry.amount} ${CURRENCY_ABBREVIATIONS[entry.currency]} (${formattedGoldValue} gp)`;
        })
        .join("\n");

      const message = header + currencyList;

      if (message.length > CONFIG.TRACKER_MESSAGE_LIMIT) {
        const dataJSON = {
          summary: {
            totalCurrencies: currencies.length,
            totalPieces: totalPieces,
            totalGoldValue: formattedTotalGold
          },
          currencies: sortedCurrencies.reduce((acc, entry) => {
            const goldValue = entry.amount * CURRENCY_TO_GOLD_CONVERSION[entry.currency];
            const formattedGoldValue = goldValue % 1 === 0 ? goldValue.toString() : goldValue.toFixed(2);
            acc[`${entry.currency} (${CURRENCY_ABBREVIATIONS[entry.currency]})`] = {
              amount: entry.amount,
              goldValue: formattedGoldValue
            };
            return acc;
          }, {})
        };

        await interaction.editReply({
          content: `**Bank Balance** (${currencies.length} currencies, ${totalPieces} total pieces, ${formattedTotalGold} total gold)\n\nThe balance is too large to display, here is a JSON file instead.`,
          files: [
            {
              attachment: Buffer.from(JSON.stringify(dataJSON, null, 2), "utf8"),
              name: `bank-balance-${interaction.channel.id}.json`,
            },
          ],
        });
      } else {
        await interaction.editReply(message);
      }
    });
  } catch (error) {
    console.error("Error in bank balance:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}