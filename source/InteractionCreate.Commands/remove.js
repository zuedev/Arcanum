import { SlashCommandBuilder } from "@discordjs/builders";
import { connect } from "../controllers/mongo.js";
import incrementItem from "../helpers/items/increment.js";
import auditLog from "../helpers/audit/log.js";

export default {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a quantity of an item")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item to remove from the quantity of")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("The quantity to remove")
        .setRequired(true)
    ),
  async execute({ interaction }) {
    const itemName = interaction.options.getString("item");
    const itemAmount = interaction.options.getInteger("quantity");

    console.log(
      `Removing ${itemAmount} "${itemName}" from the database for channel ${interaction.channel.name} (${interaction.channel.id}) in guild ${interaction.guild.name} (${interaction.guild.id}).`
    );

    const newAmount = await incrementItem({
      channelId: interaction.channel.id,
      itemName,
      itemAmount: -itemAmount,
    });

    if (newAmount === 0) {
      const mongo = await connect();

      await mongo.db("LootTracker").collection("items").deleteOne({
        channelId: interaction.channel.id,
        name: itemName,
      });

      await interaction.reply(
        `Removed the last of **${itemName}** from the database.`
      );
    } else {
      await interaction.reply(
        `Changed the quantity of **${itemName}** from \`${
          newAmount + itemAmount
        }\` to \`${newAmount}\`.`
      );
    }

    await auditLog({
      channelId: interaction.channel.id,
      message: `<@${interaction.user.id}> removed \`${itemAmount}\` **${itemName}**, leaving \`${newAmount}\` remaining`,
    });
  },
};
