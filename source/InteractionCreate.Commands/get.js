import { SlashCommandBuilder } from "@discordjs/builders";
import getItem from "../helpers/items/get.js";

export default {
  data: new SlashCommandBuilder()
    .setName("get")
    .setDescription("Get the quantity of an item")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item to get the quantity of")
        .setRequired(true)
    ),
  async execute({ interaction }) {
    const itemName = interaction.options.getString("item");

    console.log(
      `Getting quantity of "${itemName}" for channel ${interaction.channel.name} (${interaction.channel.id}) in guild ${interaction.guild.name} (${interaction.guild.id}).`
    );

    const quantity = await getItem({
      channelId: interaction.channel.id,
      itemName,
    });

    await interaction.reply(
      `This channel has \`${quantity}\` **${itemName}** stored.`
    );
  },
};
