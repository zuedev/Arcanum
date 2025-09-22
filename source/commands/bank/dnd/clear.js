import { PermissionFlagsBits } from "discord.js";
import { CONFIG, ERROR_MESSAGES } from '../shared/config.js';
import { withDatabase, recordBankAuditLog } from '../shared/utils.js';

/**
 * Handles bank clear subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankClear(interaction) {
  try {
    // Check permissions
    if (
      !interaction.channel
        .permissionsFor(interaction.member)
        ?.has(PermissionFlagsBits.ManageChannels)
    ) {
      await interaction.editReply(ERROR_MESSAGES.NO_PERMISSION);
      return;
    }

    await withDatabase(async (client) => {
      const collection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.BANK);

      // First, update any existing documents that don't have currencySystem field
      await collection.updateMany(
        { channel: interaction.channel.id, currencySystem: { $exists: false } },
        { $set: { currencySystem: "dnd" } }
      );

      // Get currencies before deletion for audit log
      const currenciesBeforeDeletion = await collection
        .find({ channel: interaction.channel.id, currencySystem: "dnd" })
        .toArray();

      const result = await collection.deleteMany({
        channel: interaction.channel.id,
        currencySystem: "dnd",
      });

      if (result.deletedCount === 0) {
        await interaction.editReply("The bank is already empty.");
      } else {
        // Record audit log
        await recordBankAuditLog(
          client,
          interaction.channel.id,
          "clear",
          interaction.user.id,
          interaction.user.username,
          {
            currenciesCleared: currenciesBeforeDeletion.map(entry => ({
              currency: entry.currency,
              amount: entry.amount
            })),
            totalCurrenciesCleared: result.deletedCount,
          }
        );

        const currencyText = result.deletedCount === 1 ? "currency" : "currencies";
        await interaction.editReply(
          `Cleared ${result.deletedCount} ${currencyText} from the bank.`
        );
      }
    });
  } catch (error) {
    console.error("Error in bank clear:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}