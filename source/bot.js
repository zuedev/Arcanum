import {
  Client,
  Events,
  ActivityType,
  Routes,
  GatewayIntentBits,
} from "discord.js";

export default async () => {
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
      // defer reply to give the bot time to process
      await interaction.deferReply();

      (
        await import(
          `./InteractionCreate.Commands/${interaction.commandName}.js`
        )
      ).default.execute({ interaction });
    } catch (error) {
      console.error(error);
      interaction.followUp("I couldn't execute that command.");
    }
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);

  async function registerCommands({ client }) {
    const commands = [];

    const commandFiles = ["ping.js", "tracker.js", "roll.js"];

    for (const file of commandFiles) {
      const { data } = (await import(`./InteractionCreate.Commands/${file}`))
        .default;

      commands.push(data);
    }

    await client.rest.put(Routes.applicationCommands(client.application.id), {
      body: commands,
    });

    console.log(
      `Global slash commands registered: ${commands.map((c) => c.name)}`
    );
  }
};

