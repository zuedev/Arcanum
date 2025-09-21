import {
  Client,
  Events,
  ActivityType,
  Routes,
  GatewayIntentBits,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { MongoClient } from "mongodb";

// ===== ENVIRONMENT VALIDATION =====

// check required environment variables are set
["DISCORD_BOT_TOKEN", "MONGODB_URI"].forEach((env) => {
  if (!process.env[env])
    throw new Error(`Environment variable ${env} is required!`);
});

// does our mongodb uri contain a db name?
if (!process.env.MONGODB_URI.match(/\/([a-zA-Z0-9-_]+)(\?|$)/))
  throw new Error(
    "MONGODB_URI must contain a database name! Example: mongodb+srv://user:password@cluster.mongodb.net/mydatabase"
  );

// ===== UTILITY FUNCTIONS =====

/**
 * Connect to MongoDB
 *
 * @returns {Promise<MongoClient>} A promise that resolves to a connected MongoClient
 *
 * @example
 * const mongo = await connect();
 *
 * // do something...
 *
 * await mongo.close(); // always close!
 */
async function connect() {
  const mongo = new MongoClient(process.env.MONGODB_URI, {
    retryWrites: true,
    writeConcern: "majority",
  });

  await mongo.connect();

  return mongo;
}

/**
 * Calculates the similarity between two strings based on the Levenshtein distance.
 * Returns a score between 0 (completely different) and 1 (identical).
 *
 * @param {string} str1 The first string.
 * @param {string} str2 The second string.
 * @returns {number} A similarity score between 0 and 1.
 */
function calculateSimilarity(str1, str2) {
  // Ensure inputs are strings
  str1 = String(str1);
  str2 = String(str2);

  const len1 = str1.length;
  const len2 = str2.length;

  // Handle empty strings
  if (len1 === 0 && len2 === 0) return 1; // Both empty, considered identical

  if (len1 === 0 || len2 === 0) return 0; // One is empty, the other isn't, completely different

  // Create a matrix to store distances
  // matrix[i][j] will store the Levenshtein distance between the first i characters of str1
  // and the first j characters of str2
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(null));

  // Initialize the first row and column
  // Distance from empty string to prefix of length i/j is i/j insertions/deletions
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      // Check if the characters are the same
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1; // 0 if match, 1 if substitution needed

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion from str1
        matrix[i][j - 1] + 1, // Insertion into str1
        matrix[i - 1][j - 1] + cost // Substitution or match
      );
    }
  }

  // The Levenshtein distance is in the bottom-right corner
  const distance = matrix[len1][len2];

  // Calculate similarity score
  // Max possible distance is the length of the longer string
  const maxLength = Math.max(len1, len2);
  const similarity = 1 - distance / maxLength;

  return similarity;
}

/**
 * Rolls a specified number of dice with a given number of sides and returns the results and total.
 *
 * @param {string} dice - The dice notation string (e.g., "2d6" for rolling two six-sided dice).
 * @returns {{ results: number[], total: number }} An object containing an array of individual roll results and their total sum.
 * @example
 * roll("3d4"); // { results: [2, 4, 1], total: 7 }
 */
export function roll(dice) {
  const [quantity, sides] = dice.split("d").map((x) => parseInt(x));

  let results = [];
  let total = 0;

  for (let i = 0; i < quantity; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    results.push(roll);
    total += roll;
  }

  return {
    results,
    total,
  };
}

// ===== BOT FUNCTIONALITY =====

async function startBot() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.on(Events.ClientReady, async () => {
    client.user.setActivity({
      type: ActivityType.Watching,
      name: "my boot logs",
    });

    await registerCommands({ client });

    console.log(`Bot has started! Logged in as ${client.user.tag}`);

    console.table({
      "Bot Tag": client.user.tag,
      "Bot ID": client.user.id,
      "Guilds Cache Size": client.guilds.cache.size,
      "Users Cache Size": client.users.cache.size,
      "Guilds Cache Member Cache Total": client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0
      ),
    });

    console.table(
      client.guilds.cache.map((guild) => {
        return {
          "Guild Name": guild.name,
          "Guild ID": guild.id,
          "Guild Member Count": guild.memberCount,
        };
      })
    );

    client.user.setActivity({
      type: ActivityType.Playing,
      name: "with my dice...",
    });
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    try {
      await interaction.deferReply();
      await executeCommand(interaction);
    } catch (error) {
      console.error(error);
      await interaction.followUp("I couldn't execute that command.");
    }
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);

  // ===== COMMAND DEFINITIONS =====

  const commands = [
    // Ping command
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with pong!"),

    // Tracker command with all subcommands
    new SlashCommandBuilder()
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

    // Roll command with all dice subcommands
    new SlashCommandBuilder()
      .setName("roll")
      .setDescription("Roll some dice")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("d20")
          .setDescription("Roll a d20")
          .addIntegerOption((option) =>
            option
              .setName("quantity")
              .setDescription("The quantity of dice to roll")
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("d12")
          .setDescription("Roll a d12")
          .addIntegerOption((option) =>
            option
              .setName("quantity")
              .setDescription("The quantity of dice to roll")
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("d10")
          .setDescription("Roll a d10")
          .addIntegerOption((option) =>
            option
              .setName("quantity")
              .setDescription("The quantity of dice to roll")
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("d100")
          .setDescription("Roll a pair of d10s for a d100")
          .addIntegerOption((option) =>
            option
              .setName("quantity")
              .setDescription("The quantity of dice to roll")
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("d8")
          .setDescription("Roll a d8")
          .addIntegerOption((option) =>
            option
              .setName("quantity")
              .setDescription("The quantity of dice to roll")
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("d6")
          .setDescription("Roll a d6")
          .addIntegerOption((option) =>
            option
              .setName("quantity")
              .setDescription("The quantity of dice to roll")
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("d4")
          .setDescription("Roll a d4")
          .addIntegerOption((option) =>
            option
              .setName("quantity")
              .setDescription("The quantity of dice to roll")
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("dx")
          .setDescription("Roll a custom die")
          .addIntegerOption((option) =>
            option
              .setName("sides")
              .setDescription("The number of sides on the die")
              .setRequired(true)
          )
          .addIntegerOption((option) =>
            option
              .setName("quantity")
              .setDescription("The quantity of dice to roll")
          )
      ),
  ];

  // ===== COMMAND EXECUTION =====

  async function executeCommand(interaction) {
    switch (interaction.commandName) {
      case "ping":
        await pingCommand(interaction);
        break;
      case "tracker":
        await trackerCommand(interaction);
        break;
      case "roll":
        await rollCommand(interaction);
        break;
      default:
        await interaction.followUp("This command is not supported.");
        break;
    }
  }

  // ===== COMMAND HANDLERS =====

  async function pingCommand(interaction) {
    return await interaction.followUp("Pong!");
  }

  async function trackerCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "add":
        await trackerAdd(interaction);
        break;
      case "remove":
        await trackerRemove(interaction);
        break;
      case "list":
        await trackerList(interaction);
        break;
      case "clear":
        await trackerClear(interaction);
        break;
      case "search":
        await trackerSearch(interaction);
        break;
      default:
        await interaction.followUp("This subcommand is not supported.");
        break;
    }
  }

  async function rollCommand(interaction) {
    let quantity = 1;
    let sides = 20;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "dx") {
      sides = interaction.options.getInteger("sides");
      quantity = interaction.options.getInteger("quantity") ?? 1;
    } else {
      sides = parseInt(subcommand.substring(1));
      quantity = interaction.options.getInteger("quantity") ?? 1;
    }

    // Apply limits: max 100 dice, max 100 sides
    if (quantity > 100) {
      return interaction.editReply("❌ Maximum of 100 dice allowed per roll.");
    }

    if (sides > 100) {
      return interaction.editReply("❌ Maximum of 100 sides allowed per die.");
    }

    // For large calculations, process in chunks to avoid timeout
    const isLargeCalculation = quantity > 100 || (quantity * sides > 100000);

    if (isLargeCalculation) {
      // Process in chunks to avoid timeout
      const chunkSize = Math.min(100, Math.max(1, Math.floor(10000 / sides)));
      let results = [];
      let total = 0;

      for (let chunk = 0; chunk < quantity; chunk += chunkSize) {
        const currentChunkSize = Math.min(chunkSize, quantity - chunk);
        const chunkDice = `${currentChunkSize}d${sides}`;
        const chunkResult = roll(chunkDice);

        results = results.concat(chunkResult.results);
        total += chunkResult.total;

        // Yield control periodically to prevent blocking
        if (chunk % (chunkSize * 10) === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }

      const reply = `**Rolling \`${quantity}d${sides}\`...**\n${`\`${results.join(
        " + "
      )} = ${total}\``}`;

      if (reply.length > 2000) {
        return interaction.editReply({
          content:
            "The result is too long to send as a message, here is a file instead.",
          files: [
            {
              attachment: Buffer.from(reply),
              name: "roll.md",
            },
          ],
        });
      }

      return interaction.editReply(reply);
    } else {
      // For small calculations, use the original fast path
      const { results, total } = roll(`${quantity}d${sides}`);

      const reply = `**Rolling \`${quantity}d${sides}\`...**\n${`\`${results.join(
        " + "
      )} = ${total}\``}`;

      if (reply.length > 2000) {
        return interaction.editReply({
          content:
            "The result is too long to send as a message, here is a file instead.",
          files: [
            {
              attachment: Buffer.from(reply),
              name: "roll.md",
            },
          ],
        });
      }

      return interaction.editReply(reply);
    }
  }

  // ===== TRACKER SUBCOMMAND HANDLERS =====

  async function trackerAdd(interaction) {
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

  async function trackerRemove(interaction) {
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

  async function trackerList(interaction) {
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

  async function trackerClear(interaction) {
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

  async function trackerSearch(interaction) {
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

  // ===== COMMAND REGISTRATION =====

  async function registerCommands({ client }) {
    await client.rest.put(Routes.applicationCommands(client.application.id), {
      body: commands,
    });

    console.log(
      `Global slash commands registered: ${commands.map((c) => c.name)}`
    );
  }
}

// ===== MAIN ENTRY POINT =====

// start the bot
await startBot();