import { SlashCommandBuilder } from "@discordjs/builders";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get help with using the bot"),
  async execute({ interaction }) {
    let helpMessage = `# LootTracker Help`;
    helpMessage += `\n\n`;
    helpMessage += `LootTracker is a bot that helps you keep track of items in your Discord server channels. You can add, remove, and list items in the database for each channel it's used in.`;
    helpMessage += `\n\n`;
    helpMessage += `## Commands`;
    helpMessage += `\n\n`;
    helpMessage += `### \`/add\``;
    helpMessage += `\n\n`;
    helpMessage += `Add a quantity of an item to the database for the channel.`;
    helpMessage += `\n\n`;
    helpMessage += `### \`/remove\``;
    helpMessage += `\n\n`;
    helpMessage += `Remove a quantity of an item from the database for the channel.`;
    helpMessage += `\n\n`;
    helpMessage += `### \`/list\``;
    helpMessage += `\n\n`;
    helpMessage += `List all items in the database for the channel.`;
    helpMessage += `\n\n`;
    helpMessage += `### \`/clear\``;
    helpMessage += `\n\n`;
    helpMessage += `Clear the database for the channel. Requires Administrator permissions at the moment.`;

    await interaction.reply(helpMessage);
  },
};
