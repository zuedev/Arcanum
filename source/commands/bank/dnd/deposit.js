import { handleDndBankDeposit } from '../shared/bankOperations.js';

/**
 * Handles bank deposit subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankDeposit(interaction) {
  await handleDndBankDeposit(interaction);
}