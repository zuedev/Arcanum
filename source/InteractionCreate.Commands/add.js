import { SlashCommandBuilder } from "@discordjs/builders";
import incrementItem from "../helpers/items/increment.js";
import auditLog from "../helpers/audit/log.js";

export default {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add a quantity of an item")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item to add to the quantity of")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("The quantity to add")
        .setRequired(true)
    ),
  async execute({ interaction }) {
    const itemName = interaction.options.getString("item");
    const itemAmount = interaction.options.getInteger("quantity");

    console.log(
      `Adding ${itemAmount} "${itemName}" to the database for channel ${interaction.channel.name} (${interaction.channel.id}) in guild ${interaction.guild.name} (${interaction.guild.id}).`
    );

    const newAmount = await incrementItem({
      channelId: interaction.channel.id,
      itemName,
      itemAmount,
    });

    await interaction.reply(
      `Changed the quantity of **${itemName}** from \`${
        newAmount - itemAmount
      }\` to \`${newAmount}\`.`
    );

    await auditLog({
      channelId: interaction.channel.id,
      message: `<@${interaction.user.id}> added \`${itemAmount}\` **${itemName}**, bringing the total to \`${newAmount}\``,
    });
  },
};
