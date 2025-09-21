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

// ===== CONSTANTS =====

const CONFIG = {
  MAX_DICE_QUANTITY: 100,
  MAX_DICE_SIDES: 100,
  MAX_ITEM_NAME_LENGTH: 100,
  MIN_SEARCH_TERM_LENGTH: 2,
  SIMILARITY_THRESHOLD: 0.5,
  DISCORD_MESSAGE_LIMIT: 2000,
  TRACKER_MESSAGE_LIMIT: 1900,
  CHUNK_SIZE_CALCULATION_THRESHOLD: 100000,
  COLLECTION_NAMES: {
    TRACKERS: "trackers",
  },
};

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];

const ERROR_MESSAGES = {
  INVALID_QUANTITY: "The quantity must be an integer greater than 0.",
  ITEM_NAME_TOO_LONG: `Item name must be ${CONFIG.MAX_ITEM_NAME_LENGTH} characters or less.`,
  ITEM_NOT_FOUND: "Item not found in the tracker.",
  TRACKER_EMPTY: "The tracker is empty.",
  SEARCH_TERM_TOO_SHORT: `Search term must be at least ${CONFIG.MIN_SEARCH_TERM_LENGTH} characters long.`,
  NO_PERMISSION: "You must have the `MANAGE_CHANNELS` permission to clear the tracker.",
  MAX_DICE_EXCEEDED: `❌ Maximum of ${CONFIG.MAX_DICE_QUANTITY} dice allowed per roll.`,
  MAX_SIDES_EXCEEDED: `❌ Maximum of ${CONFIG.MAX_DICE_SIDES} sides allowed per die.`,
  GENERIC_ERROR: "An unexpected error occurred. Please try again.",
  DATABASE_ERROR: "An error occurred while accessing the database.",
};

// ===== ENVIRONMENT VALIDATION =====

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing or invalid
 */
function validateEnvironment() {
  const requiredEnvVars = ["DISCORD_BOT_TOKEN", "MONGODB_URI"];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is required!`);
    }
  }

  // Validate MongoDB URI contains database name
  if (!process.env.MONGODB_URI.match(/\/([a-zA-Z0-9-_]+)(\?|$)/)) {
    throw new Error(
      "MONGODB_URI must contain a database name! Example: mongodb+srv://user:password@cluster.mongodb.net/mydatabase"
    );
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Connects to MongoDB with optimized settings
 * @returns {Promise<MongoClient>} Connected MongoDB client
 * @throws {Error} If connection fails
 */
async function connectToDatabase() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      retryWrites: true,
      writeConcern: "majority",
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error("Database connection failed");
  }
}

/**
 * Safely executes database operations with proper connection management
 * @param {Function} operation - Async function that performs database operations
 * @returns {Promise<any>} Result of the database operation
 */
async function withDatabase(operation) {
  let client = null;
  try {
    client = await connectToDatabase();
    return await operation(client);
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
}

/**
 * Validates and sanitizes input strings
 * @param {string} input - Input string to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized input
 * @throws {Error} If input is invalid
 */
function validateAndSanitizeString(input, maxLength = CONFIG.MAX_ITEM_NAME_LENGTH) {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  const sanitized = input.trim();

  if (sanitized.length === 0) {
    throw new Error("Input cannot be empty");
  }

  if (sanitized.length > maxLength) {
    throw new Error(`Input must be ${maxLength} characters or less`);
  }

  return sanitized;
}

/**
 * Validates numeric input
 * @param {number} value - Number to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Validated number
 * @throws {Error} If value is invalid
 */
function validateNumber(value, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Value must be an integer between ${min} and ${max}`);
  }
  return value;
}

/**
 * Calculates the similarity between two strings using Levenshtein distance
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  const s1 = String(str1).toLowerCase();
  const s2 = String(str2).toLowerCase();

  const len1 = s1.length;
  const len2 = s2.length;

  // Handle edge cases
  if (len1 === 0 && len2 === 0) return 1;
  if (len1 === 0 || len2 === 0) return 0;

  // Use space-optimized algorithm for large strings
  if (len1 > 100 || len2 > 100) {
    return calculateSimilarityOptimized(s1, s2);
  }

  // Standard matrix approach for smaller strings
  const matrix = Array.from({ length: len1 + 1 }, (_, i) =>
    Array.from({ length: len2 + 1 }, (_, j) => (i === 0 ? j : i))
  );

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // Deletion
        matrix[i][j - 1] + 1,     // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return 1 - distance / maxLength;
}

/**
 * Space-optimized similarity calculation for large strings
 * @param {string} s1 - First string
 * @param {string} s2 - Second string
 * @returns {number} Similarity score
 */
function calculateSimilarityOptimized(s1, s2) {
  const len1 = s1.length;
  const len2 = s2.length;

  let prevRow = Array.from({ length: len2 + 1 }, (_, j) => j);
  let currRow = new Array(len2 + 1);

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }

  const distance = prevRow[len2];
  const maxLength = Math.max(len1, len2);
  return 1 - distance / maxLength;
}

/**
 * Rolls dice with specified quantity and sides
 * @param {string} diceNotation - Dice notation (e.g., "2d6")
 * @returns {{results: number[], total: number}} Roll results and total
 * @throws {Error} If dice notation is invalid
 */
export function roll(diceNotation) {
  try {
    const parts = diceNotation.split("d");
    if (parts.length !== 2) {
      throw new Error("Invalid dice notation");
    }

    const quantity = validateNumber(parseInt(parts[0]), 1, CONFIG.MAX_DICE_QUANTITY);
    const sides = validateNumber(parseInt(parts[1]), 1, CONFIG.MAX_DICE_SIDES);

    const results = [];
    let total = 0;

    for (let i = 0; i < quantity; i++) {
      const rollResult = Math.floor(Math.random() * sides) + 1;
      results.push(rollResult);
      total += rollResult;
    }

    return { results, total };
  } catch (error) {
    console.error("Error in roll function:", error);
    throw new Error("Invalid dice roll parameters");
  }
}

/**
 * Formats roll results for Discord message
 * @param {number} quantity - Number of dice rolled
 * @param {number} sides - Number of sides per die
 * @param {number[]} results - Individual roll results
 * @param {number} total - Total sum
 * @returns {string} Formatted message
 */
function formatRollResult(quantity, sides, results, total) {
  const header = `**Rolling \`${quantity}d${sides}\`...**\n`;
  const resultString = `\`${results.join(" + ")} = ${total}\``;
  return header + resultString;
}

/**
 * Creates command builders with reduced repetition
 * @returns {SlashCommandBuilder[]} Array of command builders
 */
function createCommands() {
  const commands = [];

  // Ping command
  commands.push(
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with pong!")
  );

  // Tracker command
  commands.push(
    new SlashCommandBuilder()
      .setName("tracker")
      .setDescription("Manage trackers for the current channel")
      .addSubcommand(sub => sub
        .setName("add")
        .setDescription("Add something to the tracker")
        .addStringOption(opt => opt
          .setName("name")
          .setDescription("The name of the thing to add")
          .setRequired(true))
        .addIntegerOption(opt => opt
          .setName("quantity")
          .setDescription("The quantity to add")
          .setRequired(true)))
      .addSubcommand(sub => sub
        .setName("remove")
        .setDescription("Remove something from the tracker")
        .addStringOption(opt => opt
          .setName("name")
          .setDescription("The name of the thing to remove")
          .setRequired(true))
        .addIntegerOption(opt => opt
          .setName("quantity")
          .setDescription("The quantity to remove")
          .setRequired(true)))
      .addSubcommand(sub => sub
        .setName("list")
        .setDescription("List all the things in the tracker"))
      .addSubcommand(sub => sub
        .setName("clear")
        .setDescription("Clear all the things from the tracker"))
      .addSubcommand(sub => sub
        .setName("search")
        .setDescription("Search for an item in the tracker")
        .addStringOption(opt => opt
          .setName("name")
          .setDescription("The name of the thing to search for")
          .setRequired(true)))
  );

  // Roll command with all dice types
  const rollCommand = new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll some dice");

  // Add standard dice subcommands
  DICE_TYPES.forEach(sides => {
    rollCommand.addSubcommand(sub => sub
      .setName(`d${sides}`)
      .setDescription(`Roll a d${sides}`)
      .addIntegerOption(opt => opt
        .setName("quantity")
        .setDescription("The quantity of dice to roll")));
  });

  // Add custom dice subcommand
  rollCommand.addSubcommand(sub => sub
    .setName("dx")
    .setDescription("Roll a custom die")
    .addIntegerOption(opt => opt
      .setName("sides")
      .setDescription("The number of sides on the die")
      .setRequired(true))
    .addIntegerOption(opt => opt
      .setName("quantity")
      .setDescription("The quantity of dice to roll")));

  commands.push(rollCommand);
  return commands;
}

// ===== BOT FUNCTIONALITY =====

/**
 * Initializes and starts the Discord bot
 * @throws {Error} If bot initialization fails
 */
async function startBot() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    failIfNotExists: false,
  });

  // Enhanced error handling for client events
  client.on("error", (error) => {
    console.error("Discord client error:", error);
  });

  client.on("warn", (warning) => {
    console.warn("Discord client warning:", warning);
  });

  client.on(Events.ClientReady, async (readyClient) => {
    try {
      await handleClientReady(readyClient);
    } catch (error) {
      console.error("Error in client ready handler:", error);
      process.exit(1);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      await interaction.deferReply();
      await executeCommand(interaction);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);

      const errorMessage = error.message === "Database connection failed"
        ? ERROR_MESSAGES.DATABASE_ERROR
        : ERROR_MESSAGES.GENERIC_ERROR;

      try {
        if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      } catch (replyError) {
        console.error("Failed to send error response:", replyError);
      }
    }
  });

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error("Failed to login to Discord:", error);
    process.exit(1);
  }
}

/**
 * Handles client ready event
 * @param {Client} client - Discord client instance
 */
async function handleClientReady(client) {
  console.log(`Bot has started! Logged in as ${client.user.tag}`);

  // Set initial activity
  await client.user.setActivity({
    type: ActivityType.Watching,
    name: "my boot logs",
  });

  // Register commands
  await registerCommands(client);

  // Log bot statistics
  logBotStatistics(client);

  // Set final activity
  await client.user.setActivity({
    type: ActivityType.Playing,
    name: "with my dice...",
  });
}

/**
 * Logs bot statistics to console
 * @param {Client} client - Discord client instance
 */
function logBotStatistics(client) {
  const stats = {
    "Bot Tag": client.user.tag,
    "Bot ID": client.user.id,
    "Guilds Count": client.guilds.cache.size,
    "Users Count": client.users.cache.size,
    "Total Members": client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    ),
  };

  console.table(stats);

  if (client.guilds.cache.size > 0) {
    const guildInfo = client.guilds.cache.map(guild => ({
      "Guild Name": guild.name,
      "Guild ID": guild.id,
      "Member Count": guild.memberCount,
    }));

    console.table(guildInfo);
  }
}

/**
 * Registers slash commands with Discord
 * @param {Client} client - Discord client instance
 */
async function registerCommands(client) {
  try {
    const commands = createCommands();

    await client.rest.put(
      Routes.applicationCommands(client.application.id),
      { body: commands }
    );

    console.log(`Successfully registered ${commands.length} slash commands:`,
      commands.map(c => c.name).join(", "));
  } catch (error) {
    console.error("Failed to register slash commands:", error);
    throw error;
  }
}

// ===== COMMAND EXECUTION =====

/**
 * Executes the appropriate command handler
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function executeCommand(interaction) {
  const commandHandlers = {
    ping: handlePingCommand,
    tracker: handleTrackerCommand,
    roll: handleRollCommand,
  };

  const handler = commandHandlers[interaction.commandName];
  if (!handler) {
    await interaction.editReply("This command is not supported.");
    return;
  }

  await handler(interaction);
}

// ===== COMMAND HANDLERS =====

/**
 * Handles ping command
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handlePingCommand(interaction) {
  const startTime = Date.now();
  await interaction.editReply("Pong!");

  const latency = Date.now() - startTime;
  const apiLatency = Math.round(interaction.client.ws.ping);

  await interaction.editReply(
    `🏓 Pong!\n**Response Time:** ${latency}ms\n**API Latency:** ${apiLatency}ms`
  );
}

/**
 * Handles tracker command and its subcommands
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleTrackerCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();

  const subcommandHandlers = {
    add: handleTrackerAdd,
    remove: handleTrackerRemove,
    list: handleTrackerList,
    clear: handleTrackerClear,
    search: handleTrackerSearch,
  };

  const handler = subcommandHandlers[subcommand];
  if (!handler) {
    await interaction.editReply("This subcommand is not supported.");
    return;
  }

  await handler(interaction);
}

/**
 * Handles roll command
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleRollCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  let quantity = interaction.options.getInteger("quantity") ?? 1;
  let sides;

  // Parse dice parameters
  if (subcommand === "dx") {
    sides = interaction.options.getInteger("sides");
  } else {
    sides = parseInt(subcommand.substring(1));
  }

  // Validate parameters
  try {
    quantity = validateNumber(quantity, 1, CONFIG.MAX_DICE_QUANTITY);
    sides = validateNumber(sides, 1, CONFIG.MAX_DICE_SIDES);
  } catch (error) {
    if (quantity > CONFIG.MAX_DICE_QUANTITY) {
      await interaction.editReply(ERROR_MESSAGES.MAX_DICE_EXCEEDED);
    } else if (sides > CONFIG.MAX_DICE_SIDES) {
      await interaction.editReply(ERROR_MESSAGES.MAX_SIDES_EXCEEDED);
    } else {
      await interaction.editReply(ERROR_MESSAGES.GENERIC_ERROR);
    }
    return;
  }

  // Perform the roll
  try {
    const rollResult = await performDiceRoll(quantity, sides);
    const message = formatRollResult(quantity, sides, rollResult.results, rollResult.total);

    if (message.length > CONFIG.DISCORD_MESSAGE_LIMIT) {
      await interaction.editReply({
        content: "The result is too long to send as a message, here is a file instead.",
        files: [{
          attachment: Buffer.from(message, "utf8"),
          name: "roll.md",
        }],
      });
    } else {
      await interaction.editReply(message);
    }
  } catch (error) {
    console.error("Error performing dice roll:", error);
    await interaction.editReply(ERROR_MESSAGES.GENERIC_ERROR);
  }
}

/**
 * Performs dice roll with optimization for large rolls
 * @param {number} quantity - Number of dice to roll
 * @param {number} sides - Number of sides per die
 * @returns {Promise<{results: number[], total: number}>} Roll results
 */
async function performDiceRoll(quantity, sides) {
  const isLargeCalculation = quantity * sides > CONFIG.CHUNK_SIZE_CALCULATION_THRESHOLD;

  if (isLargeCalculation) {
    return await performChunkedRoll(quantity, sides);
  } else {
    return roll(`${quantity}d${sides}`);
  }
}

/**
 * Performs chunked dice roll for large calculations
 * @param {number} quantity - Total number of dice
 * @param {number} sides - Number of sides per die
 * @returns {Promise<{results: number[], total: number}>} Combined results
 */
async function performChunkedRoll(quantity, sides) {
  const chunkSize = Math.min(100, Math.max(1, Math.floor(10000 / sides)));
  const results = [];
  let total = 0;

  for (let processed = 0; processed < quantity; processed += chunkSize) {
    const currentChunkSize = Math.min(chunkSize, quantity - processed);
    const chunkResult = roll(`${currentChunkSize}d${sides}`);

    results.push(...chunkResult.results);
    total += chunkResult.total;

    // Yield control periodically to prevent blocking
    if (processed % (chunkSize * 10) === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  return { results, total };
}

// ===== TRACKER SUBCOMMAND HANDLERS =====

/**
 * Handles tracker add subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleTrackerAdd(interaction) {
  try {
    const rawName = interaction.options.getString("name");
    const quantity = interaction.options.getInteger("quantity");

    const name = validateAndSanitizeString(rawName, CONFIG.MAX_ITEM_NAME_LENGTH).toLowerCase();
    validateNumber(quantity, 1);

    await withDatabase(async (client) => {
      const collection = client.db().collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      const updateResult = await collection.findOneAndUpdate(
        { channel: interaction.channel.id, name },
        {
          $inc: { quantity },
          $setOnInsert: {
            channel: interaction.channel.id,
            name,
            createdAt: new Date(),
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, returnDocument: "after" }
      );

      const oldQuantity = updateResult.quantity - quantity;

      if (updateResult.quantity <= 0) {
        await collection.deleteOne({ channel: interaction.channel.id, name });
        await interaction.editReply(
          `Changed the quantity of **${name}** from \`${oldQuantity}\` to \`0\`. Removed the item from the tracker.`
        );
      } else {
        await interaction.editReply(
          `Changed the quantity of **${name}** from \`${oldQuantity}\` to \`${updateResult.quantity}\`.`
        );
      }
    });
  } catch (error) {
    console.error("Error in tracker add:", error);

    if (error.message.includes("characters or less")) {
      await interaction.editReply(ERROR_MESSAGES.ITEM_NAME_TOO_LONG);
    } else if (error.message.includes("integer")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_QUANTITY);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}

/**
 * Handles tracker remove subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleTrackerRemove(interaction) {
  try {
    const rawName = interaction.options.getString("name");
    const quantity = interaction.options.getInteger("quantity");

    const name = validateAndSanitizeString(rawName, CONFIG.MAX_ITEM_NAME_LENGTH).toLowerCase();
    validateNumber(quantity, 1);

    await withDatabase(async (client) => {
      const collection = client.db().collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      // Check if item exists
      const existingItem = await collection.findOne({
        channel: interaction.channel.id,
        name,
      });

      if (!existingItem) {
        await interaction.editReply(`Item **${name}** ${ERROR_MESSAGES.ITEM_NOT_FOUND.toLowerCase()}`);
        return;
      }

      const updateResult = await collection.findOneAndUpdate(
        { channel: interaction.channel.id, name },
        {
          $inc: { quantity: -quantity },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );

      const oldQuantity = updateResult.quantity + quantity;

      if (updateResult.quantity <= 0) {
        await collection.deleteOne({ channel: interaction.channel.id, name });
        await interaction.editReply(
          `Changed the quantity of **${name}** from \`${oldQuantity}\` to \`0\`. Removed the item from the tracker.`
        );
      } else {
        await interaction.editReply(
          `Changed the quantity of **${name}** from \`${oldQuantity}\` to \`${updateResult.quantity}\`.`
        );
      }
    });
  } catch (error) {
    console.error("Error in tracker remove:", error);

    if (error.message.includes("integer")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_QUANTITY);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}

/**
 * Handles tracker list subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleTrackerList(interaction) {
  try {
    await withDatabase(async (client) => {
      const collection = client.db().collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      const items = await collection
        .find({ channel: interaction.channel.id })
        .sort({ name: 1 })
        .toArray();

      if (!items.length) {
        await interaction.editReply(ERROR_MESSAGES.TRACKER_EMPTY);
        return;
      }

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const header = `**Tracker Contents** (${items.length} items, ${totalItems} total):\n\n`;
      const itemList = items
        .map((item, index) => `${index + 1}. **${item.name}**: ${item.quantity}`)
        .join("\n");

      const message = header + itemList;

      if (message.length > CONFIG.TRACKER_MESSAGE_LIMIT) {
        const dataJSON = items.reduce((acc, item) => {
          acc[item.name] = item.quantity;
          return acc;
        }, {});

        await interaction.editReply({
          content: `**Tracker Contents** (${items.length} items, ${totalItems} total)\n\nThe tracker is too large to display in a message, so here is a JSON file instead.`,
          files: [{
            attachment: Buffer.from(JSON.stringify(dataJSON, null, 2), "utf8"),
            name: `tracker-${interaction.channel.id}.json`,
          }],
        });
      } else {
        await interaction.editReply(message);
      }
    });
  } catch (error) {
    console.error("Error in tracker list:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}

/**
 * Handles tracker clear subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleTrackerClear(interaction) {
  try {
    // Check permissions
    if (!interaction.channel.permissionsFor(interaction.member)?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.editReply(ERROR_MESSAGES.NO_PERMISSION);
      return;
    }

    await withDatabase(async (client) => {
      const collection = client.db().collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      const result = await collection.deleteMany({
        channel: interaction.channel.id,
      });

      if (result.deletedCount === 0) {
        await interaction.editReply("The tracker is already empty.");
      } else {
        const itemText = result.deletedCount === 1 ? "item" : "items";
        await interaction.editReply(`Cleared ${result.deletedCount} ${itemText} from the tracker.`);
      }
    });
  } catch (error) {
    console.error("Error in tracker clear:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}

/**
 * Handles tracker search subcommand
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleTrackerSearch(interaction) {
  try {
    const rawSearchTerm = interaction.options.getString("name");
    const searchTerm = validateAndSanitizeString(rawSearchTerm).toLowerCase();

    if (searchTerm.length < CONFIG.MIN_SEARCH_TERM_LENGTH) {
      await interaction.editReply(ERROR_MESSAGES.SEARCH_TERM_TOO_SHORT);
      return;
    }

    await withDatabase(async (client) => {
      const collection = client.db().collection(CONFIG.COLLECTION_NAMES.TRACKERS);

      // First try regex search
      let results = await collection
        .find({
          channel: interaction.channel.id,
          name: { $regex: searchTerm, $options: "i" },
        })
        .sort({ name: 1 })
        .toArray();

      // If no results, try fuzzy matching
      if (results.length === 0) {
        const allItems = await collection
          .find({ channel: interaction.channel.id })
          .toArray();

        if (!allItems.length) {
          await interaction.editReply(ERROR_MESSAGES.TRACKER_EMPTY);
          return;
        }

        results = allItems
          .filter(item => calculateSimilarity(searchTerm, item.name) > CONFIG.SIMILARITY_THRESHOLD)
          .sort((a, b) =>
            calculateSimilarity(searchTerm, b.name) - calculateSimilarity(searchTerm, a.name)
          );
      }

      if (!results.length) {
        await interaction.editReply(`No items found for: **${searchTerm}**`);
        return;
      }

      const message = results.length === 1
        ? `Found 1 item:\n**${results[0].name}**: ${results[0].quantity}`
        : `Found ${results.length} items:\n` + results
            .map((item, index) => `${index + 1}. **${item.name}**: ${item.quantity}`)
            .join("\n");

      await interaction.editReply(message);
    });
  } catch (error) {
    console.error("Error in tracker search:", error);

    if (error.message.includes("characters")) {
      await interaction.editReply(ERROR_MESSAGES.SEARCH_TERM_TOO_SHORT);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}

// ===== MAIN ENTRY POINT =====

/**
 * Main application entry point
 */
async function main() {
  try {
    console.log("🚀 Starting Arcanum Discord Bot...");

    // Validate environment
    validateEnvironment();
    console.log("✅ Environment validation passed");

    // Start the bot
    await startBot();

  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the application
await main();