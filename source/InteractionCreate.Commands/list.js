import { SlashCommandBuilder } from "@discordjs/builders";
import { connect } from "../controllers/mongo.js";

export default {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("List all items in the database for this channel"),
  async execute({ interaction }) {
    console.log(
      `Listing database contents for channel ${interaction.channel.name} (${interaction.channel.id}) in guild ${interaction.guild.name} (${interaction.guild.id}).`
    );

    const mongo = await connect();

    const data = await mongo
      .db("LootTracker")
      .collection(`items`)
      .find(
        { channelId: interaction.channel.id },
        {
          projection: {
            _id: 0,
          },
        }
      )
      .toArray();

    await mongo.close();

    if (data.length === 0)
      return await interaction.reply("The database is empty.");

    const dataPretty = data.map((entry) => {
      return `**${entry.itemName}:** \`${entry.itemAmount}\``;
    });

    const dataPrettyString = dataPretty.join("\n");

    if (data.length > 2000)
      return await interaction.reply({
        files: [
          {
            attachment: Buffer.from(dataPrettyString),
            name: `channel-${interaction.channel.id}.db.json`,
          },
        ],
      });

    await interaction.reply(dataPrettyString);
  },
};
