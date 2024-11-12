import { SlashCommandBuilder } from "@discordjs/builders";
import getLatestAudit from "../helpers/audit/latest.js";

export default {
  data: new SlashCommandBuilder()
    .setName("audit")
    .setDescription("Interact with the audit log")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("latest")
        .setDescription("Get the latest audit log entries")
        .addIntegerOption((option) =>
          option
            .setName("count")
            .setDescription("The number of entries to retrieve")
            .setRequired(false)
        )
    ),
  async execute({ interaction }) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "latest":
        const count = interaction.options.getInteger("count") || 5;

        console.log(
          `Getting the latest ${count} audit log entries for channel ${interaction.channel.name} (${interaction.channel.id}) in guild ${interaction.guild.name} (${interaction.guild.id}).`
        );

        const data = await getLatestAudit({
          channelId: interaction.channel.id,
          count,
        });

        if (data.length === 0)
          return await interaction.reply("The audit log is empty.");

        const dataPretty = data.map((entry) => {
          return `[${entry.timestamp.toISOString()}] ${entry.message}`;
        });

        const dataPrettyString = dataPretty.join("\n");

        if (dataPrettyString.length > 2000)
          return await interaction.reply({
            files: [
              {
                attachment: Buffer.from(dataPrettyString),
                name: `channel-${interaction.channel.id}.audit.json`,
              },
            ],
            allowedMentions: { parse: [] },
          });

        await interaction.reply(dataPrettyString, {
          allowedMentions: { parse: [] },
        });
        break;
    }
  },
};
