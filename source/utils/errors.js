import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Centralized error handling utilities
 */

/**
 * Generic error handler for any command
 * @param {Error} error - The error that occurred
 * @param {Object} interaction - Discord interaction
 * @param {string} commandName - Name of the command
 * @param {Object} customMessages - Custom error messages mapping
 */
export async function handleCommandError(error, interaction, commandName, customMessages = {}) {
  console.error(`Error in ${commandName}:`, error);

  let errorMessage = customMessages[error.message] || ERROR_MESSAGES.GENERIC_ERROR;

  try {
    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  } catch (replyError) {
    console.error("Failed to send error response:", replyError);
  }
}