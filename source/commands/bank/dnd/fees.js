import { CONFIG, DEFAULT_CONVERSION_FEE, ERROR_MESSAGES } from '../shared/config.js';
import { withDatabase, migrateBankSettings } from '../shared/utils.js';

/**
 * Handles bank fees subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankFees(interaction) {
  try {
    await withDatabase(async (client) => {
      const settingsCollection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK_SETTINGS);

      // First, migrate any existing settings from old collections
      await migrateBankSettings(client, interaction.channel.id);

      const settings = await settingsCollection.findOne({ channel: interaction.channel.id });
      const feeRate = settings?.dnd?.feeRate || DEFAULT_CONVERSION_FEE;
      const feePercentage = (feeRate * 100).toFixed(1);

      const isDefault = !settings?.dnd?.feeRate;
      const lastUpdated = settings?.dnd?.updatedAt?.toLocaleString() || "Never";

      let message = `**Bank Conversion Fees:**\n\n`;
      message += `**Current Fee Rate:** ${feePercentage}%`;

      if (isDefault) {
        message += ` (default)\n`;
      } else {
        message += `\n**Last Updated:** ${lastUpdated}\n`;
      }

      message += `\n**Fee Examples:**\n`;
      message += `• Converting 100 gp → sp: Fee of ${Math.ceil(100 * 10 * feeRate)} sp\n`;
      message += `• Converting 50 pp → gp: Fee of ${Math.ceil(50 * 10 * feeRate)} gp\n`;
      message += `• Converting 1000 cp → gp: Fee of ${Math.ceil(10 * feeRate)} gp`;

      await interaction.editReply(message);
    });
  } catch (error) {
    console.error("Error in bank fees:", error);
    await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
  }
}