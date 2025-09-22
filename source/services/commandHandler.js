import { handlePingCommand } from '../commands/ping/index.js';
import { handleTrackerCommand } from '../commands/tracker/index.js';
import { handleRollCommand } from '../commands/dice/roll.js';
import { handleBankCommand } from '../commands/bank/index.js';

export async function executeCommand(interaction) {
  const commandHandlers = {
    ping: handlePingCommand,
    tracker: handleTrackerCommand,
    roll: handleRollCommand,
    bank: handleBankCommand,
  };

  const handler = commandHandlers[interaction.commandName];
  if (!handler) {
    await interaction.editReply("This command is not supported.");
    return;
  }

  await handler(interaction);
}