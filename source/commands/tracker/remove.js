import { CONFIG, ERROR_MESSAGES } from '../../config/constants.js';
import { validateAndSanitizeString, validateNumber } from '../../utils/validation.js';
import { withDatabase } from '../../database/connection.js';
import { recordAuditLog } from '../../database/audit.js';

/**
 * Handles tracker remove subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleTrackerRemove(interaction) {
  try {
    const rawName = interaction.options.getString("name");
    const quantity = interaction.options.getInteger("quantity");

    const name = validateAndSanitizeString(
      rawName,
      CONFIG.MAX_ITEM_NAME_LENGTH
    ).toLowerCase();
    validateNumber(quantity, 1);

    await withDatabase(async (client) => {
      const collection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      // Check if item exists
      const existingItem = await collection.findOne({
        channel: interaction.channel.id,
        name,
      });

      if (!existingItem) {
        await interaction.editReply(
          `Item **${name}** ${ERROR_MESSAGES.ITEM_NOT_FOUND.toLowerCase()}`
        );
        return;
      }

      const updateResult = await collection.findOneAndUpdate(
        { channel: interaction.channel.id, name },
        {
          $inc: { quantity: -quantity },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );

      const oldQuantity = updateResult.quantity + quantity;

      // Record audit log
      await recordAuditLog(
        client,
        interaction.channel.id,
        updateResult.quantity <= 0 ? "remove_all" : "remove",
        interaction.user.id,
        interaction.user.username,
        {
          itemName: name,
          quantityChanged: quantity,
          oldQuantity,
          newQuantity: updateResult.quantity,
        }
      );

      if (updateResult.quantity <= 0) {
        await collection.deleteOne({ channel: interaction.channel.id, name });
        await interaction.editReply(
          `Changed the quantity of **${name}** from \`${oldQuantity}\` to \`0\`. Removed the item from the tracker.`
        );
      } else {
        await interaction.editReply(
          `Changed the quantity of **${name}** from \`${oldQuantity}\` to \`${updateResult.quantity}\`.`
        );
      }
    });
  } catch (error) {
    console.error("Error in tracker remove:", error);

    if (error.message.includes("integer")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_QUANTITY);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}