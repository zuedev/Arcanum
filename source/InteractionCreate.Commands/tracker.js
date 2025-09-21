import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { connect } from "../controllers/mongo.js";
import calculateSimilarity from "../utilities/calculateSimilarity.js";

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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear")
        .setDescription("Clear all the things from the tracker")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("search")
        .setDescription("Search for an item in the tracker")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the thing to search for")
            .setRequired(true)
        )
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
      case "clear":
        await clear({ interaction });
        break;
      case "search":
        await search({ interaction });
        break;
      default:
        await interaction.followUp("This subcommand is not supported.");
        break;
    }
  },
};

async function add({ interaction }) {
  const name = interaction.options.getString("name").toLowerCase().trim();
  const quantity = interaction.options.getInteger("quantity");

  if (quantity < 1 || !Number.isInteger(quantity))
    return await interaction.followUp(
      "The quantity must be an integer greater than 0."
    );

  if (name.length > 100)
    return await interaction.followUp(
      "Item name must be 100 characters or less."
    );

  let mongo;
  try {
    mongo = await connect();
    const collection = mongo.db().collection("trackers");

    const data = await collection.findOneAndUpdate(
      { channel: interaction.channel.id, name },
      {
        $inc: { quantity },
        $setOnInsert: {
          channel: interaction.channel.id,
          name,
          createdAt: new Date()
        },
        $set: { updatedAt: new Date() }
      },
      { upsert: true, returnDocument: "after" }
    );

    // if the new quantity is 0 or negative, remove the document
    if (data.quantity <= 0) {
      await collection.deleteOne({ channel: interaction.channel.id, name });
      await interaction.followUp(
        `Changed the quantity of **${name}** from \`${
          data.quantity - quantity
        }\` to \`0\`. Removed the item from the tracker.`
      );
    } else {
      await interaction.followUp(
        `Changed the quantity of **${name}** from \`${
          data.quantity - quantity
        }\` to \`${data.quantity}\`.`
      );
    }
  } catch (error) {
    console.error("Error in tracker add:", error);
    await interaction.followUp("An error occurred while updating the tracker.");
  } finally {
    if (mongo) await mongo.close();
  }
}

async function remove({ interaction }) {
  const name = interaction.options.getString("name").toLowerCase().trim();
  const quantity = interaction.options.getInteger("quantity");

  if (quantity < 1 || !Number.isInteger(quantity))
    return await interaction.followUp(
      "The quantity must be an integer greater than 0."
    );

  let mongo;
  try {
    mongo = await connect();
    const collection = mongo.db().collection("trackers");

    // Check if item exists first
    const existingItem = await collection.findOne({
      channel: interaction.channel.id,
      name
    });

    if (!existingItem) {
      return await interaction.followUp(
        `Item **${name}** not found in the tracker.`
      );
    }

    const data = await collection.findOneAndUpdate(
      { channel: interaction.channel.id, name },
      {
        $inc: { quantity: -quantity },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: "after" }
    );

    // if the new quantity is 0 or negative, remove the document
    if (data.quantity <= 0) {
      await collection.deleteOne({ channel: interaction.channel.id, name });
      await interaction.followUp(
        `Changed the quantity of **${name}** from \`${
          data.quantity + quantity
        }\` to \`0\`. Removed the item from the tracker.`
      );
    } else {
      await interaction.followUp(
        `Changed the quantity of **${name}** from \`${
          data.quantity + quantity
        }\` to \`${data.quantity}\`.`
      );
    }
  } catch (error) {
    console.error("Error in tracker remove:", error);
    await interaction.followUp("An error occurred while updating the tracker.");
  } finally {
    if (mongo) await mongo.close();
  }
}

async function list({ interaction }) {
  let mongo;
  try {
    mongo = await connect();
    const collection = mongo.db().collection("trackers");

    const data = await collection
      .find({ channel: interaction.channel.id })
      .sort({ name: 1 })
      .toArray();

    if (!data.length) {
      return await interaction.followUp("The tracker is empty.");
    }

    const totalItems = data.reduce((sum, item) => sum + item.quantity, 0);
    const header = `**Tracker Contents** (${data.length} items, ${totalItems} total):\n\n`;

    const itemList = data
      .map((item, index) => `${index + 1}. **${item.name}**: ${item.quantity}`)
      .join("\n");

    const message = header + itemList;

    if (message.length > 1900) {
      const dataJSON = {};
      data.forEach((item) => {
        dataJSON[item.name] = item.quantity;
      });

      return await interaction.followUp({
        content: `**Tracker Contents** (${data.length} items, ${totalItems} total)\n\nThe tracker is too large to display in a message, so here is a JSON file instead.`,
        files: [
          {
            attachment: Buffer.from(JSON.stringify(dataJSON, null, 2)),
            name: `tracker-${interaction.channel.id}.json`,
          },
        ],
      });
    }

    await interaction.followUp(message);
  } catch (error) {
    console.error("Error in tracker list:", error);
    await interaction.followUp("An error occurred while retrieving the tracker.");
  } finally {
    if (mongo) await mongo.close();
  }
}

async function clear({ interaction }) {
  // check if the user has the MANAGE_CHANNELS permission
  if (
    !interaction.channel
      .permissionsFor(interaction.member)
      .has(PermissionFlagsBits.ManageChannels)
  )
    return await interaction.followUp(
      "You must have the `MANAGE_CHANNELS` permission to clear the tracker."
    );

  let mongo;
  try {
    mongo = await connect();
    const collection = mongo.db().collection("trackers");

    const result = await collection.deleteMany({
      channel: interaction.channel.id
    });

    if (result.deletedCount === 0) {
      await interaction.followUp("The tracker is already empty.");
    } else {
      await interaction.followUp(
        `Cleared ${result.deletedCount} item${result.deletedCount === 1 ? '' : 's'} from the tracker.`
      );
    }
  } catch (error) {
    console.error("Error in tracker clear:", error);
    await interaction.followUp("An error occurred while clearing the tracker.");
  } finally {
    if (mongo) await mongo.close();
  }
}

async function search({ interaction }) {
  const searchTerm = interaction.options.getString("name").toLowerCase().trim();

  if (searchTerm.length < 2) {
    return await interaction.followUp(
      "Search term must be at least 2 characters long."
    );
  }

  let mongo;
  try {
    mongo = await connect();
    const collection = mongo.db().collection("trackers");

    // Use MongoDB text search if available, otherwise fallback to regex
    const regexQuery = {
      channel: interaction.channel.id,
      name: { $regex: searchTerm, $options: "i" }
    };

    const data = await collection
      .find(regexQuery)
      .sort({ name: 1 })
      .toArray();

    // If no exact matches, use fuzzy matching
    let results = data;
    if (results.length === 0) {
      const allItems = await collection
        .find({ channel: interaction.channel.id })
        .toArray();

      if (!allItems.length) {
        return await interaction.followUp("The tracker is empty.");
      }

      results = allItems
        .filter(item => calculateSimilarity(searchTerm, item.name) > 0.5)
        .sort((a, b) =>
          calculateSimilarity(searchTerm, b.name) - calculateSimilarity(searchTerm, a.name)
        );
    }

    if (!results.length) {
      return await interaction.followUp(`No items found for: **${searchTerm}**`);
    }

    const message = results.length === 1
      ? `Found 1 item:\n**${results[0].name}**: ${results[0].quantity}`
      : `Found ${results.length} items:\n` + results
          .map((item, index) => `${index + 1}. **${item.name}**: ${item.quantity}`)
          .join("\n");

    await interaction.followUp(message);
  } catch (error) {
    console.error("Error in tracker search:", error);
    await interaction.followUp("An error occurred while searching the tracker.");
  } finally {
    if (mongo) await mongo.close();
  }
}
