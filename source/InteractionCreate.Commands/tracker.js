import { SlashCommandBuilder } from "@discordjs/builders";
import { connect } from "../controllers/mongo.js";

export default {
  data: new SlashCommandBuilder()
    .setName("tracker")
    .setDescription("Manage trackers for the current channel")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add something to the tracker")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the thing to add")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity to add")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove something from the tracker")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the thing to remove")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity to remove")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List all the things in the tracker")
    ),
  async execute({ interaction }) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "add":
        await add({ interaction });
        break;
      case "remove":
        await remove({ interaction });
        break;
      case "list":
        await list({ interaction });
        break;
      default:
        await interaction.reply("This subcommand is not supported.");
        break;
    }
  },
};

async function add({ interaction }) {
  const name = interaction.options.getString("name").toLowerCase();
  const quantity = interaction.options.getInteger("quantity");

  if (quantity < 1 || !Number.isInteger(quantity))
    return await interaction.reply(
      "The quantity must be an integer greater than 0."
    );

  const mongo = await connect();

  const data = await mongo
    .db(process.env.ENVIRONMENT)
    .collection("trackers")
    .findOneAndUpdate(
      { channel: interaction.channel.id, name },
      {
        $inc: { quantity },
        $setOnInsert: { channel: interaction.channel.id, name },
      },
      { upsert: true, returnDocument: "after" }
    );

  // if the new quantity is 0, remove the document
  if (data.quantity === 0) {
    await mongo
      .db(process.env.ENVIRONMENT)
      .collection("trackers")
      .deleteOne({ channel: interaction.channel.id, name });

    await interaction.reply(
      `Changed the quantity of **${name}** from \`${
        data.quantity - quantity
      }\` to \`0\`. Removed the item from the tracker.`
    );
  } else {
    await interaction.reply(
      `Changed the quantity of **${name}** from \`${
        data.quantity - quantity
      }\` to \`${data.quantity}\`.`
    );
  }
}

async function remove({ interaction }) {
  const name = interaction.options.getString("name").toLowerCase();
  const quantity = interaction.options.getInteger("quantity");

  if (quantity < 1 || !Number.isInteger(quantity))
    return await interaction.reply(
      "The quantity must be an integer greater than 0."
    );

  const mongo = await connect();

  const data = await mongo
    .db(process.env.ENVIRONMENT)
    .collection("trackers")
    .findOneAndUpdate(
      { channel: interaction.channel.id, name },
      {
        $inc: { quantity: -quantity },
        $setOnInsert: { channel: interaction.channel.id, name },
      },
      { upsert: true, returnDocument: "after" }
    );

  // if the new quantity is 0, remove the document
  if (data.quantity === 0) {
    await mongo
      .db(process.env.ENVIRONMENT)
      .collection("trackers")
      .deleteOne({ channel: interaction.channel.id, name });

    await interaction.reply(
      `Changed the quantity of **${name}** from \`${
        data.quantity + quantity
      }\` to \`0\`. Removed the item from the tracker.`
    );
  } else {
    await interaction.reply(
      `Changed the quantity of **${name}** from \`${
        data.quantity + quantity
      }\` to \`${data.quantity}\`.`
    );
  }

  await mongo.close();
}

async function list({ interaction }) {
  const mongo = await connect();

  const data = await mongo
    .db(process.env.ENVIRONMENT)
    .collection("trackers")
    .find({ channel: interaction.channel.id })
    .toArray();

  await mongo.close();

  if (!data.length) return await interaction.reply("The tracker is empty.");

  const message = data
    .map((item) => `**${item.name}**: ${item.quantity}`)
    .join("\n");

  if (message.length > 2000) {
    const dataJSON = {};

    data.forEach((item) => {
      dataJSON[item.name] = item.quantity;
    });

    return await interaction.reply({
      content:
        "The tracker is too large to be displayed in a single message, so here is a JSON file instead.",
      files: [
        {
          attachment: Buffer.from(JSON.stringify(dataJSON, null, 2)),
          name: `tracker-${interaction.channel.id}.json`,
        },
      ],
    });
  }

  await interaction.reply(message);
}
