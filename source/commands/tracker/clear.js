import { PermissionFlagsBits } from "discord.js";
import { CONFIG, ERROR_MESSAGES } from '../../config/constants.js';
import { withDatabase, recordAuditLog } from '../../database/operations.js';

/**
 * Handles tracker clear subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleTrackerClear(interaction) {
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
        .collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      // Get items before deletion for audit log
      const itemsBeforeDeletion = await collection
        .find({ channel: interaction.channel.id })
        .toArray();

      const result = await collection.deleteMany({
        channel: interaction.channel.id,
      });

      if (result.deletedCount === 0) {
        await interaction.editReply("The tracker is already empty.");
      } else {
        // Record audit log
        await recordAuditLog(
          {
            channel: interaction.channel.id,
            action: "clear",
            userId: interaction.user.id,
            username: interaction.user.username,
            details: {
              itemsCleared: itemsBeforeDeletion.map(item => ({
                name: item.name,
                quantity: item.quantity
              })),
              totalItemsCleared: result.deletedCount,
            }
          },
          client,
          CONFIG.COLLECTION_NAMES.TRACKER_AUDIT_LOG
        );

        const itemText = result.deletedCount === 1 ? "item" : "items";
        await interaction.editReply(
          `Cleared ${result.deletedCount} ${itemText} from the tracker.`
        );
      }
    });
  } catch (error) {
    console.error("Error in tracker clear:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}