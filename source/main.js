import bot from "./bot.js";

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

// start the bot
await bot();
