import { CONFIG, CURRENCY_ABBREVIATIONS, CURRENCY_TO_GOLD_CONVERSION, ERROR_MESSAGES } from '../shared/config.js';
import { validateCurrency, validateNumber, withDatabase, recordBankAuditLog, getBankFeeRate } from '../shared/utils.js';

/**
 * Handles bank convert subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankConvert(interaction) {
  try {
    const fromCurrency = validateCurrency(interaction.options.getString("from"));
    const toCurrency = validateCurrency(interaction.options.getString("to"));
    const amount = validateNumber(interaction.options.getInteger("amount"), 1);

    if (fromCurrency === toCurrency) {
      await interaction.editReply(ERROR_MESSAGES.SAME_CURRENCY_CONVERSION);
      return;
    }

    await withDatabase(async (client) => {
      const bankCollection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK);

      // Get fee rate for this channel first
      const feeRate = await getBankFeeRate(client, interaction.channel.id);

      // Calculate fee from source currency first
      const feeAmount = Math.ceil(amount * feeRate);
      const totalRequired = amount + feeAmount;

      // First, update any existing documents that don't have currencySystem field
      await bankCollection.updateMany(
        { channel: interaction.channel.id, currencySystem: { $exists: false } },
        { $set: { currencySystem: "dnd" } }
      );

      // Check if user has sufficient balance (including fee)
      const sourceEntry = await bankCollection.findOne({
        channel: interaction.channel.id,
        currency: fromCurrency,
        currencySystem: "dnd",
      });

      if (!sourceEntry || sourceEntry.amount < totalRequired) {
        const currentAmount = sourceEntry?.amount || 0;
        await interaction.editReply(
          `${ERROR_MESSAGES.INSUFFICIENT_CONVERSION_BALANCE} Available: \`${currentAmount}\` ${CURRENCY_ABBREVIATIONS[fromCurrency]}, required: \`${totalRequired}\` ${CURRENCY_ABBREVIATIONS[fromCurrency]} (\`${amount}\` + \`${feeAmount}\` fee).`
        );
        return;
      }

      // Calculate conversion from the full requested amount - must result in whole integers
      const goldValue = amount * CURRENCY_TO_GOLD_CONVERSION[fromCurrency];
      const finalConvertedAmount = goldValue / CURRENCY_TO_GOLD_CONVERSION[toCurrency];

      // Only allow conversions that result in whole numbers
      if (!Number.isInteger(finalConvertedAmount)) {
        // Calculate nearest amounts that would result in whole number conversions
        const lowerConvertedAmount = Math.floor(finalConvertedAmount);
        const higherConvertedAmount = Math.ceil(finalConvertedAmount);

        // Calculate the source amounts needed for these whole number conversions
        const lowerSourceAmount = Math.round(lowerConvertedAmount * CURRENCY_TO_GOLD_CONVERSION[toCurrency] / CURRENCY_TO_GOLD_CONVERSION[fromCurrency]);
        const higherSourceAmount = Math.round(higherConvertedAmount * CURRENCY_TO_GOLD_CONVERSION[toCurrency] / CURRENCY_TO_GOLD_CONVERSION[fromCurrency]);

        let suggestions = [];
        if (lowerConvertedAmount > 0 && lowerSourceAmount !== amount) {
          suggestions.push(`\`${lowerSourceAmount}\` ${CURRENCY_ABBREVIATIONS[fromCurrency]} → \`${lowerConvertedAmount}\` ${CURRENCY_ABBREVIATIONS[toCurrency]}`);
        }
        if (higherSourceAmount !== amount) {
          suggestions.push(`\`${higherSourceAmount}\` ${CURRENCY_ABBREVIATIONS[fromCurrency]} → \`${higherConvertedAmount}\` ${CURRENCY_ABBREVIATIONS[toCurrency]}`);
        }

        const suggestionText = suggestions.length > 0 ? `\n\nTry these amounts instead:\n${suggestions.join('\n')}` : '';

        await interaction.editReply(
          `Cannot convert \`${amount}\` ${CURRENCY_ABBREVIATIONS[fromCurrency]} to **${toCurrency}** - conversion must result in whole numbers.${suggestionText}`
        );
        return;
      }

      // Perform the conversion
      // Remove source currency (conversion amount + fee)
      await bankCollection.updateOne(
        { channel: interaction.channel.id, currency: fromCurrency, currencySystem: "dnd" },
        { $inc: { amount: -totalRequired }, $set: { updatedAt: new Date() } }
      );

      // Add target currency
      await bankCollection.findOneAndUpdate(
        { channel: interaction.channel.id, currency: toCurrency, currencySystem: "dnd" },
        {
          $inc: { amount: finalConvertedAmount },
          $setOnInsert: {
            channel: interaction.channel.id,
            currency: toCurrency,
            currencySystem: "dnd",
            createdAt: new Date(),
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );

      // Clean up zero balances
      await bankCollection.deleteMany({
        channel: interaction.channel.id,
        currencySystem: "dnd",
        amount: { $lte: 0 }
      });

      // Record audit log
      await recordBankAuditLog(
        client,
        interaction.channel.id,
        "convert",
        interaction.user.id,
        interaction.user.username,
        {
          fromCurrency,
          toCurrency,
          fromAmount: amount,
          feeAmount: feeAmount,
          totalDeducted: totalRequired,
          toAmount: finalConvertedAmount,
          feeRate: feeRate
        }
      );

      const feePercentage = (feeRate * 100).toFixed(1);
      await interaction.editReply(
        `Converted \`${amount}\` **${fromCurrency}** (${CURRENCY_ABBREVIATIONS[fromCurrency]}) → \`${finalConvertedAmount}\` **${toCurrency}** (${CURRENCY_ABBREVIATIONS[toCurrency]})\n` +
        `Fee: ${feePercentage}% (\`${feeAmount}\` ${CURRENCY_ABBREVIATIONS[fromCurrency]} deducted before conversion)`
      );
    });
  } catch (error) {
    console.error("Error in bank convert:", error);

    if (error.message.includes("currency")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_CURRENCY);
    } else if (error.message.includes("integer")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_QUANTITY);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}