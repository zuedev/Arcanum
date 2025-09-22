import { CONFIG, ERROR_MESSAGES } from '../../config/constants.js';
import { withDatabase } from '../../database/connection.js';

/**
 * Handles tracker list subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleTrackerList(interaction) {
  try {
    await withDatabase(async (client) => {
      const collection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      const items = await collection
        .find({ channel: interaction.channel.id })
        .sort({ name: 1 })
        .toArray();

      if (!items.length) {
        await interaction.editReply(ERROR_MESSAGES.TRACKER_EMPTY);
        return;
      }

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const header = `**Tracker Contents** (${items.length} items, ${totalItems} total):\n\n`;
      const itemList = items
        .map(
          (item, index) => `${index + 1}. **${item.name}**: ${item.quantity}`
        )
        .join("\n");

      const message = header + itemList;

      if (message.length > CONFIG.TRACKER_MESSAGE_LIMIT) {
        const dataJSON = items.reduce((acc, item) => {
          acc[item.name] = item.quantity;
          return acc;
        }, {});

        await interaction.editReply({
          content: `**Tracker Contents** (${items.length} items, ${totalItems} total)\n\nThe tracker is too large to display in a message, so here is a JSON file instead.`,
          files: [
            {
              attachment: Buffer.from(
                JSON.stringify(dataJSON, null, 2),
                "utf8"
              ),
              name: `tracker-${interaction.channel.id}.json`,
            },
          ],
        });
      } else {
        await interaction.editReply(message);
      }
    });
  } catch (error) {
    console.error("Error in tracker list:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}