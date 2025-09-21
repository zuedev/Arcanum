# Arcanum

<img src="icon.png" height="100" alt="Arcanum Bot Avatar">

> A streamlined Discord bot for essential TTRPG functionality.

Arcanum is a focused Discord bot designed to provide core tabletop RPG functionality on Discord. It offers comprehensive dice rolling, persistent item tracking, and basic utilities. Built with Node.js and Discord.js, it's lightweight, reliable, and easy to deploy.

## Features

- **🎲 Dice Rolling**: Full dice rolling system supporting standard dice (d4, d6, d8, d10, d12, d20, d100) and custom dice
- **📦 Item Tracking**: MongoDB-based persistent item tracking system with search functionality
- **🏓 Bot Status**: Simple ping command to check bot responsiveness
- **🔧 Minimal Configuration**: Simple environment-based setup

## Quick Start

### Using the Public Instance

The easiest way to get started is by inviting our hosted bot to your server:

**[🔗 Invite Arcanum to Your Server](https://discord.com/oauth2/authorize?client_id=1274868942753628210)**

### Self-Hosting

#### Prerequisites

- Node.js 18+
- MongoDB database
- Discord Bot Token

#### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/zuedev/arcanum.git
   cd arcanum
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the bot:
   ```bash
   npm start
   ```

## Commands

### `/roll` - Dice Rolling System
- `/roll d20` - Roll a d20 (with optional quantity)
- `/roll d12`, `/roll d10`, `/roll d8`, `/roll d6`, `/roll d4` - Roll standard dice
- `/roll d100` - Roll percentile dice
- `/roll dx` - Roll custom dice with specified sides

### `/tracker` - Item Tracking System
- `/tracker add` - Add items to the tracker with quantities
- `/tracker remove` - Remove items from the tracker
- `/tracker list` - Display all tracked items
- `/tracker search` - Search for specific items using fuzzy matching
- `/tracker clear` - Clear all items (requires MANAGE_CHANNELS permission)

### `/ping` - Bot Status
- Simple command to check if the bot is responsive

## Configuration

### Required Environment Variables

```bash
ENVIRONMENT=production          # or development
DISCORD_BOT_TOKEN=your_token   # Discord bot token
MONGODB_URI=your_mongodb_uri   # MongoDB connection string
```

### Optional Configuration

```bash
# Development
DEVELOPMENT_GUILD_ID=guild_id  # Restrict bot to specific guild during development
```

## Development

### Development Setup

1. Install dependencies: `npm install`
2. Copy environment template: `cp .env.example .env`
3. Configure your `.env` file with development values
4. Run in development mode: `npm run dev`

### Testing

```bash
npm test
```

### Project Structure

```
source/
├── main.js                           # Application entry point
├── bot.js                            # Discord bot setup and event handling
├── InteractionCreate.Commands/       # Slash command implementations
│   ├── roll.js                      # Dice rolling commands
│   ├── tracker.js                   # Item tracking system
│   └── ping.js                      # Status command
├── library/                         # Core utilities
│   └── roll.js                      # Dice rolling engine
├── controllers/                     # Database controllers
│   └── mongo.js                     # MongoDB operations
└── utilities/                       # Helper functions
    └── calculateSimilarity.js       # String matching for tracker search
```

## Docker Deployment

Build and run with Docker:

```bash
docker build -t arcanum .
docker run -e DISCORD_BOT_TOKEN=your_token -e MONGODB_URI=your_uri arcanum
```

## Contributing

Arcanum is open-source and welcomes contributions! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is released into the public domain under the [Unlicense](LICENSE). You are free to use, modify, and distribute this software for any purpose without restriction.

## Support

- **Issues**: [GitHub Issues](https://github.com/zuedev/arcanum/issues)
- **Discord**: Join our community for support and updates
- **Documentation**: Check this README and inline code documentation

---

_Simple, reliable TTRPG tools for your Discord server!_ ✨