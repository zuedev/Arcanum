# Arcanum Discord Bot

A Discord bot for tabletop gaming enthusiasts, featuring dice rolling and item tracking functionality.

## Features

### 🎲 Dice Rolling

- Roll standard dice: `/roll d4`, `/roll d6`, `/roll d8`, `/roll d10`, `/roll d12`, `/roll d20`, `/roll d100`
- Roll custom dice: `/roll dx sides:20 quantity:3`
- Roll multiple dice: `/roll d20 quantity:5`
- Supports up to 100 dice per roll with a maximum of 100 sides per die
- Optimized for large rolls with chunked processing to avoid timeouts

### 📋 Item Tracking

- **Add items**: `/tracker add name:sword quantity:2`
- **Remove items**: `/tracker remove name:sword quantity:1`
- **List all items**: `/tracker list`
- **Search for items**: `/tracker search name:sw` (supports fuzzy matching)
- **Clear tracker**: `/tracker clear` (requires user to have the MANAGE_CHANNELS permission)
- Per-channel tracking with automatic cleanup of zero-quantity items

### 🏓 Utility

- **Ping**: `/ping` - Check if the bot is responsive

## Installation

### Add to Your Server

[**Click here to add Arcanum to your Discord server**](https://discord.com/oauth2/authorize?client_id=1274868942753628210)

### Self-Hosting

#### Prerequisites

- Node.js 18 or higher
- MongoDB database
- Discord bot token

#### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/zuedev/Arcanum.git
   cd Arcanum
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:

   ```env
   DISCORD_BOT_TOKEN=your_bot_token_here
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/arcanum
   ```

4. Start the bot:
   ```bash
   npm run dev  # Development mode with .env file
   npm start    # Production mode
   ```

#### Testing

Run the test suite:

```bash
npm test
```

## Usage Examples

### Dice Rolling

```
/roll d20                    # Roll a single d20
/roll d6 quantity:4          # Roll 4 d6 dice
/roll dx sides:100 quantity:2 # Roll 2 custom 100-sided dice
```

### Item Tracking

```
/tracker add name:"Health Potion" quantity:3
/tracker remove name:"Health Potion" quantity:1
/tracker list
/tracker search name:potion
/tracker clear  # Requires MANAGE_CHANNELS permission
```

## Technical Details

- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js
- **Database**: MongoDB
- **Discord Library**: discord.js v14
- **Architecture**: Modular command system with centralized bot logic

## Permissions Required

The bot only requires the ability to register slash commands and send messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and dedicated to the public domain. Feel free to use, modify, and distribute as needed.

## Support

For issues or questions, please open an issue on [GitHub](https://github.com/zuedev/Arcanum/issues).
