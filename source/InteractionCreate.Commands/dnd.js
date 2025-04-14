import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import calculateSimilarity from "../utilities/calculateSimilarity.js";

let data = new SlashCommandBuilder()
  .setName("dnd")
  .setDescription("Do stuff with D&D data");

if (process.dnd)
  data = data.addSubcommandGroup((subcommandGroup) => {
    subcommandGroup.setName("lookup").setDescription("Lookup D&D data");

    if (process.dnd.items)
      subcommandGroup.addSubcommand((subcommand) =>
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
      subcommandGroup.addSubcommand((subcommand) =>
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

    return subcommandGroup;
  });

export default {
  data,
  async execute({ interaction }) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    switch (subcommandGroup) {
      case "lookup":
        switch (subcommand) {
          case "item":
            await lookupItem(interaction);
            break;
          case "monster":
            await lookupMonster(interaction);
            break;
        }
        break;
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
