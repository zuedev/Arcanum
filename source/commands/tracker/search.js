import { CONFIG, ERROR_MESSAGES } from '../../config/constants.js';
import { validateAndSanitizeString } from '../../utils/validation.js';
import { calculateSimilarity } from '../../utils/similarity.js';
import { withDatabase } from '../../database/operations.js';

/**
 * Handles tracker search subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleTrackerSearch(interaction) {
  try {
    const rawSearchTerm = interaction.options.getString("name");
    const searchTerm = validateAndSanitizeString(rawSearchTerm).toLowerCase();

    if (searchTerm.length < CONFIG.MIN_SEARCH_TERM_LENGTH) {
      await interaction.editReply(ERROR_MESSAGES.SEARCH_TERM_TOO_SHORT);
      return;
    }

    await withDatabase(async (client) => {
      const collection = client
        .db()
        .collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      // First try regex search
      let results = await collection
        .find({
          channel: interaction.channel.id,
          name: { $regex: searchTerm, $options: "i" },
        })
        .sort({ name: 1 })
        .toArray();

      // If no results, try fuzzy matching
      if (results.length === 0) {
        const allItems = await collection
          .find({ channel: interaction.channel.id })
          .toArray();

        if (!allItems.length) {
          await interaction.editReply(ERROR_MESSAGES.TRACKER_EMPTY);
          return;
        }

        results = allItems
          .filter(
            (item) =>
              calculateSimilarity(searchTerm, item.name) >
              CONFIG.SIMILARITY_THRESHOLD
          )
          .sort(
            (a, b) =>
              calculateSimilarity(searchTerm, b.name) -
              calculateSimilarity(searchTerm, a.name)
          );
      }

      if (!results.length) {
        await interaction.editReply(`No items found for: **${searchTerm}**`);
        return;
      }

      const message =
        results.length === 1
          ? `Found 1 item:\n**${results[0].name}**: ${results[0].quantity}`
          : `Found ${results.length} items:\n` +
            results
              .map(
                (item, index) =>
                  `${index + 1}. **${item.name}**: ${item.quantity}`
              )
              .join("\n");

      await interaction.editReply(message);
    });
  } catch (error) {
    console.error("Error in tracker search:", error);

    if (error.message.includes("characters")) {
      await interaction.editReply(ERROR_MESSAGES.SEARCH_TERM_TOO_SHORT);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}