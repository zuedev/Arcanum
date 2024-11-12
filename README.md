<img src="avatar.png" width="128" height="128">

# LootTrackerDiscordBot

> A Discord bot that tracks loot, best used for TTRPGs like D&D.

## Install

We have a public instance of this bot available here: https://discord.com/oauth2/authorize?client_id=1274868942753628210&permissions=8&integration_type=0&scope=bot

Otherwise, you can run your own instance of the bot by following these steps:

1. Clone the repository
2. Copy the contents of `.env.example` into a new file called `.env` and fill in the values
3. Run the bot with `docker-compose up -d -f docker-compose.dev.yml`

## Usage

The bot currently uses messages to track loot. You need to mention it at the start of the message, and then use the `help` command to see the available commands.

## Development

The following features are planned:

- [x] Basic functionality using messages
- [x] Add a database for persistent storage
- [x] Command for clearing all loot (requires moderation permissions for channel)
- [x] Command for listing all loot
- [ ] Better responses (no more reactions)
- [x] Allow strings with spaces in loot names
- [x] Add an audit log for all loot changes
- [x] Use slash commands for better UX
- [ ] Add a web interface for easier loot tracking
