import {
  Client,
  Events,
  ActivityType,
  Routes,
  GatewayIntentBits,
} from "discord.js";
import { readdirSync } from "fs";

// check required environment variables are set
["ENVIRONMENT", "DISCORD_BOT_TOKEN", "MONGODB_URI"].forEach((env) => {
  if (!process.env[env])
    throw new Error(`Environment variable ${env} is required!`);
});

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

  client.user.setActivity({
    type: ActivityType.Playing,
    name: "with my dice...",
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  // ignore non-dev commands in dev guild
  if (process.env.DEVELOPMENT_GUILD_ID)
    if (interaction.guild.id !== process.env.DEVELOPMENT_GUILD_ID) return;

  try {
    (
      await import(`./InteractionCreate.Commands/${interaction.commandName}.js`)
    ).default.execute({ interaction });
  } catch (error) {
    console.error(error);
    interaction.reply("I couldn't execute that command.");
  }
});

await client.login(process.env.DISCORD_BOT_TOKEN);

async function registerCommands({ client }) {
  const commands = [];

  const commandFiles = readdirSync(
    "./source/InteractionCreate.Commands"
  ).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const { data } = (await import(`./InteractionCreate.Commands/${file}`))
      .default;

    commands.push(data);
  }

  if (process.env.DEVELOPMENT_GUILD_ID) {
    console.log(
      "Development guild ID set, registering slash commands there instead."
    );

    await client.rest.put(
      Routes.applicationGuildCommands(
        client.application.id,
        process.env.DEVELOPMENT_GUILD_ID
      ),
      {
        body: commands,
      }
    );

    console.log(
      `Slash commands registered in development guild: ${commands.map(
        (c) => c.name
      )}`
    );
  } else {
    await client.rest.put(Routes.applicationCommands(client.application.id), {
      body: commands,
    });

    console.log(
      `Global slash commands registered: ${commands.map((c) => c.name)}`
    );
  }
}
