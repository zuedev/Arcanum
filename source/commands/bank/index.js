// Import DnD bank command handlers
import { handleBankDeposit } from './dnd/deposit.js';
import { handleBankWithdraw } from './dnd/withdraw.js';
import { handleBankBalance } from './dnd/balance.js';
import { handleBankClear } from './dnd/clear.js';
import { handleBankAudit } from './dnd/audit.js';
import { handleBankConvert } from './dnd/convert.js';
import { handleBankSetFee } from './dnd/setfee.js';
import { handleBankFees } from './dnd/fees.js';

// Import decimal bank command handlers
import { handleDecimalBankDeposit } from './decimal/deposit.js';
import { handleDecimalBankWithdraw } from './decimal/withdraw.js';
import { handleDecimalBankBalance } from './decimal/balance.js';
import { handleDecimalBankClear } from './decimal/clear.js';
import { handleDecimalBankAudit } from './decimal/audit.js';
import { handleDecimalBankSetFormat } from './decimal/setformat.js';
import { handleDecimalBankFormat } from './decimal/format.js';

/**
 * Main bank command router
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
export async function handleBankCommand(interaction) {
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  // Handle the dnd subcommand group
  if (subcommandGroup === "dnd") {
    const subcommandHandlers = {
      deposit: handleBankDeposit,
      withdraw: handleBankWithdraw,
      balance: handleBankBalance,
      clear: handleBankClear,
      audit: handleBankAudit,
      convert: handleBankConvert,
      setfee: handleBankSetFee,
      fees: handleBankFees,
    };

    const handler = subcommandHandlers[subcommand];
    if (!handler) {
      await interaction.editReply("This D&D bank subcommand is not supported.");
      return;
    }

    await handler(interaction);
  } else if (subcommandGroup === "decimal") {
    const subcommandHandlers = {
      deposit: handleDecimalBankDeposit,
      withdraw: handleDecimalBankWithdraw,
      balance: handleDecimalBankBalance,
      clear: handleDecimalBankClear,
      audit: handleDecimalBankAudit,
      setformat: handleDecimalBankSetFormat,
      format: handleDecimalBankFormat,
    };

    const handler = subcommandHandlers[subcommand];
    if (!handler) {
      await interaction.editReply("This decimal bank subcommand is not supported.");
      return;
    }

    await handler(interaction);
  } else {
    await interaction.editReply("Please specify a currency system (e.g., /bank dnd or /bank decimal).");
  }
}