import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord.js";
import { connect } from "../controllers/mongo.js";
import auditLog from "../helpers/audit/log.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear the database for this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute({ interaction }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply(
        "You do not have permission to use this command."
      );

    console.log(
      `Clearing the database for channel ${interaction.channel.name} (${interaction.channel.id}) in guild ${interaction.guild.name} (${interaction.guild.id}).`
    );

    const mongo = await connect();

    const data = await mongo.db("LootTracker").collection(`items`).deleteMany({
      channelId: interaction.channel.id,
    });

    await mongo.close();

    await interaction.reply(
      `Cleared the database for this channel. Deleted \`${data.deletedCount}\` entries.`
    );

    await auditLog({
      channelId: interaction.channel.id,
      message: `<@${interaction.user.id}> cleared the database for this channel, deleting \`${data.deletedCount}\` entries.`,
    });
  },
};
