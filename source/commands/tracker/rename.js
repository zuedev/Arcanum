import { CONFIG, ERROR_MESSAGES } from '../../config/constants.js';
import { validateAndSanitizeString } from '../../utils/validation.js';
import { withDatabase, recordAuditLog } from '../../database/operations.js';

/**
 * Handles tracker rename subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleTrackerRename(interaction) {
  try {
    const rawOldName = interaction.options.getString("old_name");
    const rawNewName = interaction.options.getString("new_name");

    const oldName = validateAndSanitizeString(
      rawOldName,
      CONFIG.MAX_ITEM_NAME_LENGTH
    ).toLowerCase();
    const newName = validateAndSanitizeString(
      rawNewName,
      CONFIG.MAX_ITEM_NAME_LENGTH
    ).toLowerCase();

    if (oldName === newName) {
      await interaction.editReply("The old name and new name cannot be the same.");
      return;
    }

    await withDatabase(async (client) => {
      const collection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      // Check if the old item exists
      const existingItem = await collection.findOne({
        channel: interaction.channel.id,
        name: oldName,
      });

      if (!existingItem) {
        await interaction.editReply(
          `Item **${oldName}** ${ERROR_MESSAGES.ITEM_NOT_FOUND.toLowerCase()}`
        );
        return;
      }

      // Check if an item with the new name already exists
      const conflictingItem = await collection.findOne({
        channel: interaction.channel.id,
        name: newName,
      });

      if (conflictingItem) {
        // Merge the quantities
        const totalQuantity = existingItem.quantity + conflictingItem.quantity;

        // Update the conflicting item with the merged quantity
        await collection.updateOne(
          { channel: interaction.channel.id, name: newName },
          {
            $set: {
              quantity: totalQuantity,
              updatedAt: new Date(),
            },
          }
        );

        // Delete the old item
        await collection.deleteOne({
          channel: interaction.channel.id,
          name: oldName,
        });

        // Record audit log for merge
        await recordAuditLog(
          client,
          interaction.channel.id,
          "rename_merge",
          interaction.user.id,
          interaction.user.username,
          {
            oldName,
            newName,
            oldQuantity: existingItem.quantity,
            mergedWithQuantity: conflictingItem.quantity,
            totalQuantity,
          }
        );

        await interaction.editReply(
          `Renamed **${oldName}** to **${newName}** and merged with existing item. New quantity: \`${totalQuantity}\`.`
        );
      } else {
        // Simple rename without merging
        await collection.updateOne(
          { channel: interaction.channel.id, name: oldName },
          {
            $set: {
              name: newName,
              updatedAt: new Date(),
            },
          }
        );

        // Record audit log for simple rename
        await recordAuditLog(
          client,
          interaction.channel.id,
          "rename",
          interaction.user.id,
          interaction.user.username,
          {
            oldName,
            newName,
            quantity: existingItem.quantity,
          }
        );

        await interaction.editReply(
          `Renamed **${oldName}** to **${newName}**.`
        );
      }
    });
  } catch (error) {
    console.error("Error in tracker rename:", error);

    if (error.message.includes("characters or less")) {
      await interaction.editReply(ERROR_MESSAGES.ITEM_NAME_TOO_LONG);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}