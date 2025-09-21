import bot from "./bot.js";

// check required environment variables are set
["DISCORD_BOT_TOKEN", "MONGODB_URI"].forEach((env) => {
  if (!process.env[env])
    throw new Error(`Environment variable ${env} is required!`);
});

// start the bot
await bot();
