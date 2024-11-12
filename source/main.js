import "dotenv/config";

import {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
  ActivityType,
  Routes,
} from "discord.js";

import { readdirSync } from "fs";

const client = new Client({
  intents: Object.values(GatewayIntentBits),
  partials: Object.values(Partials),
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

  try {
    (
      await import(`./InteractionCreate.Commands/${interaction.commandName}.js`)
    ).default.execute({ interaction });
  } catch (error) {
    log(error);
    interaction.reply("I couldn't execute that command.");
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (!message.guild)
    return message.reply("I can only be used in servers right now, sorry! D:");

  const prefix = `<@${client.user.id}>`;

  if (message.content.startsWith(prefix)) {
    try {
      const [command, ...args] = message.content
        .slice(prefix.length)
        .trim()
        .split(" ");

      (await import(`./MessageCreate.Commands/${command}.js`)).default({
        message,
        args,
      });
    } catch (error) {
      console.log(error);
      message.channel.send("That command does not exist.");
    }
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
      "Development guild ID set, registering slash commands there and clearing global commands."
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
