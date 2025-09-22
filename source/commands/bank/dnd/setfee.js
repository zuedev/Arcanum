import { PermissionFlagsBits } from "discord.js";
import { CONFIG, ERROR_MESSAGES } from '../shared/config.js';
import { validateFeeRate, withDatabase, recordBankAuditLog, migrateBankSettings } from '../shared/utils.js';

/**
 * Handles bank setfee subcommand for D&D currency system
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankSetFee(interaction) {
  try {
    // Check permissions
    if (
      !interaction.channel
        .permissionsFor(interaction.member)
        ?.has(PermissionFlagsBits.ManageChannels)
    ) {
      await interaction.editReply(ERROR_MESSAGES.NO_PERMISSION);
      return;
    }

    const feeRate = validateFeeRate(interaction.options.getNumber("rate"));

    await withDatabase(async (client) => {
      const settingsCollection = client.db().collection(CONFIG.COLLECTION_NAMES.BANK_SETTINGS);

      // First, migrate any existing settings from old collections
      await migrateBankSettings(client, interaction.channel.id);

      await settingsCollection.findOneAndUpdate(
        { channel: interaction.channel.id },
        {
          $set: {
            "dnd.feeRate": feeRate,
            "dnd.updatedAt": new Date(),
            "dnd.updatedBy": interaction.user.id,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            channel: interaction.channel.id,
            currencySystem: "dnd",
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Record audit log
      await recordBankAuditLog(
        client,
        interaction.channel.id,
        "setfee",
        interaction.user.id,
        interaction.user.username,
        {
          newFeeRate: feeRate,
          feePercentage: (feeRate * 100).toFixed(1)
        }
      );

      const feePercentage = (feeRate * 100).toFixed(1);
      await interaction.editReply(
        `Set currency conversion fee to \`${feePercentage}%\` for this channel.`
      );
    });
  } catch (error) {
    console.error("Error in bank setfee:", error);

    if (error.message.includes("Fee rate")) {
      await interaction.editReply(ERROR_MESSAGES.INVALID_FEE_RATE);
    } else {
      await interaction.editReply(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}