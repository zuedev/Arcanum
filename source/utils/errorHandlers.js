import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Centralized error handling utilities
 */

/**
 * Handles bank command errors consistently
 * @param {Error} error - The error that occurred
 * @param {Object} interaction - Discord interaction
 * @param {string} commandType - Type of command (deposit, withdraw, etc.)
 */
export async function handleBankError(error, interaction, commandType) {
  console.error(`Error in bank ${commandType}:`, error);

  let errorMessage = ERROR_MESSAGES.DATABASE_ERROR;

  if (error.message.includes("currency")) {
    errorMessage = ERROR_MESSAGES.INVALID_CURRENCY;
  } else if (error.message.includes("integer") || error.message.includes("number")) {
    errorMessage = ERROR_MESSAGES.INVALID_QUANTITY;
  } else if (error.message.includes("fee")) {
    errorMessage = ERROR_MESSAGES.INVALID_FEE_RATE;
  }

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

/**
 * Handles tracker command errors consistently
 * @param {Error} error - The error that occurred
 * @param {Object} interaction - Discord interaction
 * @param {string} commandType - Type of command (add, remove, etc.)
 */
export async function handleTrackerError(error, interaction, commandType) {
  console.error(`Error in tracker ${commandType}:`, error);

  let errorMessage = ERROR_MESSAGES.DATABASE_ERROR;

  if (error.message.includes("quantity")) {
    errorMessage = ERROR_MESSAGES.INVALID_QUANTITY;
  } else if (error.message.includes("name") || error.message.includes("length")) {
    errorMessage = ERROR_MESSAGES.ITEM_NAME_TOO_LONG;
  } else if (error.message.includes("search")) {
    errorMessage = ERROR_MESSAGES.SEARCH_TERM_TOO_SHORT;
  } else if (error.message.includes("permission")) {
    errorMessage = ERROR_MESSAGES.NO_PERMISSION;
  }

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