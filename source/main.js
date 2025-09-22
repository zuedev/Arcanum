import {
  Client,
  Events,
  ActivityType,
  Routes,
  GatewayIntentBits,
} from "discord.js";

// Import configuration
import { ERROR_MESSAGES } from './config/constants.js';

// Import utilities
import { validateEnvironment } from './utils/validation.js';
import { formatUptime, formatBytes } from './utils/formatting.js';

// Import services
import { createCommands } from './services/commands.js';
import { executeCommand } from './services/commandHandler.js';

// ===== ENVIRONMENT VALIDATION =====

validateEnvironment();

// ===== BOT FUNCTIONALITY =====

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
      const { handleCommandError } = await import('./utils/errorHandlers.js');

      const customMessages = {
        "Database connection failed": ERROR_MESSAGES.DATABASE_ERROR
      };

      await handleCommandError(error, interaction, interaction.commandName, customMessages);
    }
  });

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error("Failed to login to Discord:", error);
    process.exit(1);
  }
}

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

async function logBotStatistics(client) {
  console.log("\n📊 Bot Statistics Dashboard");
  console.log("=".repeat(50));

  // Basic bot information
  const botStats = {
    "Bot Tag": client.user.tag,
    "Bot ID": client.user.id,
    Created: client.user.createdAt.toLocaleString(),
    Verified: client.user.bot ? "✅ Yes" : "❌ No",
    System: client.user.system ? "✅ Yes" : "❌ No",
  };

  console.log("\n🤖 Bot Information:");
  console.table(botStats);

  // Calculate guild and user statistics
  const totalMembers = client.guilds.cache.reduce(
    (acc, guild) => acc + guild.memberCount,
    0
  );
  const avgMembersPerGuild =
    client.guilds.cache.size > 0
      ? Math.round(totalMembers / client.guilds.cache.size)
      : 0;
  const largestGuild = client.guilds.cache.reduce(
    (max, guild) => (guild.memberCount > max.memberCount ? guild : max),
    { memberCount: 0 }
  );
  const smallestGuild = client.guilds.cache.reduce(
    (min, guild) => (guild.memberCount < min.memberCount ? guild : min),
    { memberCount: Infinity }
  );

  // Connection and performance stats
  const uptime = process.uptime();
  const uptimeFormatted = formatUptime(uptime);
  const memoryUsage = process.memoryUsage();
  const memoryUsageFormatted = {
    RSS: formatBytes(memoryUsage.rss),
    "Heap Used": formatBytes(memoryUsage.heapUsed),
    "Heap Total": formatBytes(memoryUsage.heapTotal),
    External: formatBytes(memoryUsage.external),
  };

  const serverStats = {
    Guilds: client.guilds.cache.size,
    "Cached Users": client.users.cache.size,
    "Total Members": totalMembers.toLocaleString(),
    "Avg Members/Guild": avgMembersPerGuild.toLocaleString(),
    "Largest Guild": `${largestGuild.name || "N/A"} (${
      largestGuild.memberCount?.toLocaleString() || "0"
    })`,
    "Smallest Guild": `${smallestGuild.name || "N/A"} (${
      smallestGuild.memberCount?.toLocaleString() || "0"
    })`,
  };

  console.log("\n🌐 Server Statistics:");
  console.table(serverStats);

  // Get Discord.js version dynamically
  let discordVersion = "Unknown";
  try {
    // Method 1: Try to get version from Discord.js constants
    if (client.rest?.version) {
      discordVersion = client.rest.version;
    } else {
      // Method 2: Read package.json directly from filesystem
      const fs = await import('fs');
      const path = await import('path');
      const packagePath = path.resolve(process.cwd(), 'node_modules', 'discord.js', 'package.json');

      if (fs.existsSync(packagePath)) {
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageData = JSON.parse(packageContent);
        discordVersion = packageData.version;
      }
    }
  } catch (error) {
    // Fallback to reading from our own package.json dependencies
    try {
      const fs = await import('fs');
      const path = await import('path');
      const ourPackagePath = path.resolve(process.cwd(), 'package.json');

      if (fs.existsSync(ourPackagePath)) {
        const ourPackageContent = fs.readFileSync(ourPackagePath, 'utf8');
        const ourPackageData = JSON.parse(ourPackageContent);
        const discordDep = ourPackageData.dependencies?.['discord.js'];
        if (discordDep) {
          discordVersion = discordDep.replace(/[\^~]/, ''); // Remove version prefixes
        }
      }
    } catch (fallbackError) {
      discordVersion = "14.15.3"; // Final fallback
    }
  }

  const performanceStats = {
    "API Latency": `${Math.round(client.ws.ping)}ms`,
    Uptime: uptimeFormatted,
    "Node.js Version": process.version,
    "Discord.js Version": discordVersion,
    Platform: `${process.platform} ${process.arch}`,
  };

  console.log("\n⚡ Performance & System:");
  console.table(performanceStats);

  console.log("\n💾 Memory Usage:");
  console.table(memoryUsageFormatted);

  // Log enabled intents
  const intents = [];
  const intentsBitfield = client.options.intents;
  const intentFlags = Object.entries(GatewayIntentBits);
  for (const [key, value] of intentFlags) {
    if (intentsBitfield.has(value)) {
      intents.push(key);
    }
  }

  console.log("\n🔑 Enabled Intents:");
  intents.forEach((intent) => console.log(`  • ${intent}`));

  // List of guilds
  console.log("\n🏠 Connected Guilds:");
  client.guilds.cache.forEach((guild) => {
    console.log(
      `  • ${guild.name} (ID: ${
        guild.id
      }) - ${guild.memberCount.toLocaleString()} members`
    );
  });

  // Database connection info (obfuscated)
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    const obfuscatedUri = mongoUri.replace(
      /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
      "mongodb+srv://***:***@"
    );
    console.log("\n🗄️ Database:");
    console.log(`  • Connection String: ${obfuscatedUri}`);
  }

  // Environmental variables status (without revealing values)
  const envVars = ["DISCORD_BOT_TOKEN", "MONGODB_URI"];
  console.log("\n🔒 Environment Variables:");
  envVars.forEach((envVar) => {
    const status = process.env[envVar] ? "✅ Set" : "❌ Not Set";
    console.log(`  • ${envVar}: ${status}`);
  });

  console.log("\n" + "=".repeat(50));
  console.log("✅ Bot initialization complete!");
  console.log("=".repeat(50) + "\n");
}

async function registerCommands(client) {
  try {
    const commands = createCommands();

    await client.rest.put(Routes.applicationCommands(client.application.id), {
      body: commands,
    });

    console.log(
      `Successfully registered ${commands.length} slash commands:`,
      commands.map((c) => c.name).join(", ")
    );
  } catch (error) {
    console.error("Failed to register slash commands:", error);
    throw error;
  }
}

// ===== MAIN EXECUTION =====

async function main() {
  try {
    console.log("Starting bot...");
    await startBot();
  } catch (error) {
    console.error("Fatal error during startup:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\nReceived SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\nReceived SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the bot
main();