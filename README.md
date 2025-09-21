# Arcanum

<img src="icon.png" height="100" alt="Arcanum Bot Avatar">

> An open-source Discord bot to empower TTRPGs on Discord.

Arcanum is a feature-rich Discord bot designed to enhance tabletop RPG gameplay. It offers comprehensive dice rolling, D&D 5e data lookups, loot tracking, and optional homebrew content support. Built with Node.js and Discord.js, it's free, community-driven, and highly customizable to streamline your TTRPG experience on Discord.

## Features

- **🎲 Dice Rolling**: Full dice rolling system supporting standard dice (d4, d6, d8, d10, d12, d20, d100) and custom dice
- **📚 D&D 5e Integration**: Item and creature lookups with official D&D 5e data
- **📦 Loot Tracking**: MongoDB-based persistent loot tracking system
- **🧪 Homebrew Content**: Optional alchemy system with custom homebrew content
- **🔧 Flexible Configuration**: Environment-based configuration for different deployment scenarios
- **📊 Error Tracking**: Integrated Sentry error monitoring and performance tracking

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

- `/roll` - Comprehensive dice rolling system
  - `/roll d20` - Roll a d20 (with optional quantity)
  - `/roll d12`, `/roll d10`, `/roll d8`, `/roll d6`, `/roll d4` - Roll standard dice
  - `/roll d100` - Roll percentile dice
  - `/roll dx` - Roll custom dice with specified sides
- `/dnd` - D&D 5e data lookups (items, creatures, and lore)
- `/tracker` - Persistent loot and item tracking
- `/alchemy` - Homebrew alchemy system (optional)
- `/ping` - Bot status and latency check

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

# Monitoring
SENTRY_DSN=your_sentry_dsn     # Error tracking and performance monitoring

# D&D 5e Data
DND_DATA_DIR=path/to/data      # Local D&D data directory
DND_DATA_BASE_URL=https://url  # Remote D&D data URL

# Homebrew Content
ENABLE_HOMEBREW_CONTENT=true   # Enable alchemy and homebrew features
```

## Development

### Development Setup

1. Install dependencies: `npm install`
2. Copy environment template: `cp .env.example .env`
3. Configure your `.env` file with development values
4. Run in development mode: `npm run dev`
5. Run with auto-reload: `npm run dev:watch`

### Testing

```bash
npm test
```

### Project Structure

```
source/
├── main.js                           # Application entry point
├── bot.js                            # Discord bot setup and event handling
├── instrument.js                     # Sentry instrumentation
├── InteractionCreate.Commands/       # Slash command implementations
│   ├── roll.js                      # Dice rolling commands
│   ├── dnd.js                       # D&D 5e data lookups
│   ├── tracker.js                   # Loot tracking system
│   ├── alchemy.js                   # Homebrew alchemy system
│   └── ping.js                      # Status command
├── library/                         # Core utilities
│   └── roll.js                      # Dice rolling engine
├── controllers/                     # Database controllers
│   └── mongo.js                     # MongoDB operations
├── data/                           # Static data files
│   └── alchemy/                    # Homebrew alchemy data
└── utilities/                      # Helper functions
    └── calculateSimilarity.js      # String matching utilities
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

_Enhance your TTRPG sessions with Arcanum - where magic meets technology!_ ✨
