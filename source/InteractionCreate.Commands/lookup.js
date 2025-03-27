import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders";

let data = new SlashCommandBuilder()
  .setName("lookup")
  .setDescription("Lookup an item from D&D");

if (process.dnd.items)
  data = data.addSubcommand((subcommand) =>
    subcommand
      .setName("item")
      .setDescription("Lookup a specific item")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("The item name to lookup")
          .setRequired(true)
      )
  );

if (process.dnd.bestiary)
  data = data.addSubcommand((subcommand) =>
    subcommand
      .setName("monster")
      .setDescription("Lookup a specific monster")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("The monster name to lookup")
          .setRequired(true)
      )
  );

export default {
  data,
  async execute({ interaction }) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "item":
        await lookupItem(interaction);
        break;

      case "monster":
        await lookupMonster(interaction);
        break;

      default:
        return await interaction.reply("I couldn't execute that command.");
    }
  },
};

async function lookupItem(interaction) {
  const itemName = interaction.options.getString("name");

  const item = process.dnd.items.filter(
    (i) => i.name.toLowerCase() === itemName.toLowerCase()
  );

  if (item.length === 0) {
    let bestMatches = [];

    for (const i of process.dnd.items) {
      const similarity = calculateSimilarity(
        i.name.toLowerCase(),
        itemName.toLowerCase()
      );

      if (similarity >= 0.5) bestMatches.push({ item: i, similarity });
    }

    if (bestMatches.length === 0)
      return await interaction.reply(
        `I couldn't find the item: \`${itemName}\``
      );

    bestMatches.sort((a, b) => b.similarity - a.similarity);

    // remove duplicates
    bestMatches = bestMatches.filter(
      (v, i, a) => a.findIndex((t) => t.item.name === v.item.name) === i
    );

    return await interaction.reply(
      `I couldn't find that item, did you mean one of these?\n${bestMatches
        .slice(0, 9)
        .map((m) => `- ${m.item.name} (${(m.similarity * 100).toFixed(2)}%)`)
        .join("\n")}`
    );
  }

  const embeds = [];

  for (const i of item) {
    let embed = new EmbedBuilder();

    let title = i.name;
    if (i.reprintedAs) title += ` (Legacy)`;
    embed.setTitle(title);

    if (i.entries) {
      embed.setDescription(
        i.entries.join("\n\n").replace(/\{@\w+ ([^|]+)\|[^}]+\}/g, "$1")
      );
    } else {
      embed.setDescription(
        "No description available. My Devs have been informed of this issue and will fix it soon."
      );

      console.error(`No description available for item: ${i.name}`);
    }

    if (i.rarity)
      switch (i.rarity) {
        case "common":
          // grey (default)
          embed.setColor([128, 128, 128]);
          break;
        case "uncommon":
          // green
          embed.setColor([31, 194, 25]);
          break;
        case "rare":
          // blue
          embed.setColor([73, 144, 226]);
          break;
        case "very rare":
          // purple
          embed.setColor([152, 16, 224]);
          break;
        case "legendary":
          // orange
          embed.setColor([254, 162, 39]);
          break;
        case "artifact":
          // gold?
          embed.setColor([190, 137, 114]);
          break;
        default:
          // black
          embed.setColor([0, 0, 0]);
          break;
      }

    let footer = [];
    if (i.source) footer.push(`Source: ${i.source}`);
    if (i.page) footer.push(`page ${i.page}`);
    embed.setFooter({
      text: footer.join(", "),
    });

    if (process.env.DND_DATA_BASE_URL && i.source && i.hasFluffImages)
      embed.setImage(
        `${process.env.DND_DATA_BASE_URL}/img/items/${
          i.source
        }/${encodeURIComponent(
          i.name.replace(/'/g, "").replace(/^\+\d+\s/, "")
        )}.webp`
      );

    embeds.push(embed);
  }

  await interaction.reply({ embeds });
}

async function lookupMonster(interaction) {
  const monsterName = interaction.options.getString("name");

  const monster = process.dnd.bestiary.filter(
    (m) => m.name.toLowerCase() === monsterName.toLowerCase()
  );

  if (monster.length === 0) {
    let bestMatches = [];

    for (const m of process.dnd.bestiary) {
      const similarity = calculateSimilarity(
        m.name.toLowerCase(),
        monsterName.toLowerCase()
      );

      if (similarity >= 0.5) bestMatches.push({ monster: m, similarity });
    }

    if (bestMatches.length === 0)
      return await interaction.reply(
        `I couldn't find the monster: \`${monsterName}\``
      );

    bestMatches.sort((a, b) => b.similarity - a.similarity);

    // remove duplicates
    bestMatches = bestMatches.filter(
      (v, i, a) => a.findIndex((t) => t.monster.name === v.monster.name) === i
    );

    return await interaction.reply(
      `I couldn't find that monster, did you mean one of these?\n${bestMatches
        .slice(0, 9)
        .map((m) => `- ${m.monster.name} (${(m.similarity * 100).toFixed(2)}%)`)
        .join("\n")}`
    );
  }

  const embeds = [];

  for (const m of monster) {
    let embed = new EmbedBuilder();

    let title = m.name;
    if (m.reprintedAs) title += ` (Legacy)`;
    embed.setTitle(title);

    if (m.hasFluff) {
      // look up fluff in bestiaryFluff data
      const fluff = process.dnd.bestiaryFluff.find(
        (f) => f.name.toLowerCase() === m.name.toLowerCase()
      );

      if (fluff) {
        embed.setDescription(
          fluff.entries[0].entries[0].entries[0].replace(
            /\{@\w+ ([^|]+)\|[^}]+\}/g,
            "$1"
          )
        );
      } else {
        embed.setDescription(
          "No description available. My Devs have been informed of this issue and will fix it soon."
        );

        console.error(`No description available for monster: ${m.name}`);
      }
    }

    let footer = [];
    if (m.source) footer.push(`Source: ${m.source}`);
    if (m.page) footer.push(`page ${m.page}`);
    embed.setFooter({
      text: footer.join(", "),
    });

    if (process.env.DND_DATA_BASE_URL && m.source && m.hasFluffImages)
      embed.setImage(
        `${process.env.DND_DATA_BASE_URL}/img/bestiary/${
          m.source
        }/${encodeURIComponent(
          m.name.replace(/'/g, "").replace(/^\+\d+\s/, "")
        )}.webp`
      );

    embeds.push(embed);
  }

  await interaction.reply({ embeds });
}

/**
 * Calculates the similarity between two strings based on the Levenshtein distance.
 * Returns a score between 0 (completely different) and 1 (identical).
 *
 * @param {string} str1 The first string.
 * @param {string} str2 The second string.
 * @returns {number} A similarity score between 0 and 1.
 */
function calculateSimilarity(str1, str2) {
  // Ensure inputs are strings
  str1 = String(str1);
  str2 = String(str2);

  const len1 = str1.length;
  const len2 = str2.length;

  // Handle empty strings
  if (len1 === 0 && len2 === 0) return 1; // Both empty, considered identical

  if (len1 === 0 || len2 === 0) return 0; // One is empty, the other isn't, completely different

  // Create a matrix to store distances
  // matrix[i][j] will store the Levenshtein distance between the first i characters of str1
  // and the first j characters of str2
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(null));

  // Initialize the first row and column
  // Distance from empty string to prefix of length i/j is i/j insertions/deletions
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      // Check if the characters are the same
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1; // 0 if match, 1 if substitution needed

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion from str1
        matrix[i][j - 1] + 1, // Insertion into str1
        matrix[i - 1][j - 1] + cost // Substitution or match
      );
    }
  }

  // The Levenshtein distance is in the bottom-right corner
  const distance = matrix[len1][len2];

  // Calculate similarity score
  // Max possible distance is the length of the longer string
  const maxLength = Math.max(len1, len2);
  const similarity = 1 - distance / maxLength;

  return similarity;
}
