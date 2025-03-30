import {
  Client,
  Events,
  ActivityType,
  Routes,
  GatewayIntentBits,
} from "discord.js";
import { readdirSync } from "fs";

export default async () => {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.on(Events.ClientReady, async () => {
    client.user.setActivity({
      type: ActivityType.Watching,
      name: "my boot logs",
    });

    await dndData();

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

    // ignore non-dev commands in dev guild
    if (process.env.DEVELOPMENT_GUILD_ID)
      if (interaction.guild.id !== process.env.DEVELOPMENT_GUILD_ID) return;

    try {
      (
        await import(
          `./InteractionCreate.Commands/${interaction.commandName}.js`
        )
      ).default.execute({ interaction });
    } catch (error) {
      console.error(error);
      interaction.reply("I couldn't execute that command.");
    }
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);

  async function registerCommands({ client }) {
    const commands = [];

    let commandFiles = readdirSync(
      "./source/InteractionCreate.Commands"
    ).filter((file) => file.endsWith(".js"));

    // remove dnd.js if we don't have dnd data
    if (!process.dnd)
      commandFiles = commandFiles.filter((file) => file !== "dnd.js");

    // remove alchemy.js if we don't have ENABLE_HOMEBREW_CONTENT set to true
    if (
      !process.env.ENABLE_HOMEBREW_CONTENT ||
      process.env.ENABLE_HOMEBREW_CONTENT !== "true"
    )
      commandFiles = commandFiles.filter((file) => file !== "alchemy.js");

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
};

async function dndData() {
  if (process.env.DND_DATA_DIR) {
    try {
      console.log(`D&D data directory set: ${process.env.DND_DATA_DIR}`);
      console.log(`Attempting to load D&D data into memory...`);

      process.dnd ??= {
        items: (
          await import(`../${process.env.DND_DATA_DIR}/items.json`, {
            with: { type: "json" },
          })
        ).default.item,
      };
      console.log(`${process.dnd.items.length} items loaded.`);

      const bestiaryIndex = (
        await import(`../${process.env.DND_DATA_DIR}/bestiary/index.json`, {
          with: { type: "json" },
        })
      ).default;

      process.dnd.bestiary = [];

      for (const bestiary of Object.values(bestiaryIndex)) {
        process.dnd.bestiary.push(
          ...(
            await import(
              `../${process.env.DND_DATA_DIR}/bestiary/${bestiary}`,
              {
                with: { type: "json" },
              }
            )
          ).default.monster
        );
      }
      console.log(`${process.dnd.bestiary.length} bestiary entries loaded.`);

      const bestiaryFluffIndex = (
        await import(
          `../${process.env.DND_DATA_DIR}/bestiary/fluff-index.json`,
          {
            with: { type: "json" },
          }
        )
      ).default;

      process.dnd.bestiaryFluff = [];

      for (const bestiaryFluff of Object.values(bestiaryFluffIndex)) {
        process.dnd.bestiaryFluff.push(
          ...(
            await import(
              `../${process.env.DND_DATA_DIR}/bestiary/${bestiaryFluff}`,
              {
                with: { type: "json" },
              }
            )
          ).default.monsterFluff
        );
      }
      console.log(
        `${process.dnd.bestiaryFluff.length} bestiary "fluff" entries loaded.`
      );
    } catch (error) {
      console.error(`Failed to load D&D data: ${error.message}`);
    }
  }

  if (!process.dnd && process.env.DND_DATA_BASE_URL) {
    try {
      console.log(
        `D&D data directory not set or failed to load, but we have a data url: ${process.env.DND_DATA_BASE_URL}`
      );
      console.log(`Attempting to load D&D data into memory from URL alone...`);

      process.dnd ??= {
        items: (
          await fetch(process.env.DND_DATA_BASE_URL + "/data/items.json").then(
            (res) => res.json()
          )
        ).item,
      };
      console.log(`${process.dnd.items.length} items loaded.`);

      const bestiaryIndex = await fetch(
        process.env.DND_DATA_BASE_URL + "/data/bestiary/index.json"
      ).then((res) => res.json());

      process.dnd.bestiary = [];

      for (const bestiary of Object.values(bestiaryIndex)) {
        process.dnd.bestiary.push(
          ...(
            await fetch(
              process.env.DND_DATA_BASE_URL + "/data/bestiary/" + bestiary
            ).then((res) => res.json())
          ).monster
        );
      }
      console.log(`${process.dnd.bestiary.length} bestiary entries loaded.`);

      const bestiaryFluffIndex = await fetch(
        process.env.DND_DATA_BASE_URL + "/data/bestiary/fluff-index.json"
      ).then((res) => res.json());

      process.dnd.bestiaryFluff = [];

      for (const bestiaryFluff of Object.values(bestiaryFluffIndex)) {
        process.dnd.bestiaryFluff.push(
          ...(
            await fetch(
              process.env.DND_DATA_BASE_URL + "/data/bestiary/" + bestiaryFluff
            ).then((res) => res.json())
          ).monsterFluff
        );
      }
      console.log(
        `${process.dnd.bestiaryFluff.length} bestiary "fluff" entries loaded.`
      );
    } catch (error) {
      console.error(`Failed to load D&D data from URL: ${error.message}`);
    }
  }
}
