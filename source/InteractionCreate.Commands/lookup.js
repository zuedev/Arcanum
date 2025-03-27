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

export default {
  data,
  async execute({ interaction }) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "item":
        await lookupItem(interaction);
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

  if (!item)
    return await interaction.reply(`I couldn't find the item: \`${itemName}\``);

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
