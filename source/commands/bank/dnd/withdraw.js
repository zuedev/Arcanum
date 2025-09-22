import { handleDndBankWithdraw } from '../shared/bankOperations.js';

/**
 * Handles bank withdraw subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankWithdraw(interaction) {
  await handleDndBankWithdraw(interaction);
}