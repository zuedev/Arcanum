import { createBankCommand } from "../commands/bank/command.js";
import { createDiceCommand } from "../commands/dice/command.js";
import { createPingCommand } from "../commands/ping/command.js";
import { createTrackerCommand } from "../commands/tracker/command.js";

export function createCommands() {
  const commands = [
    createPingCommand(),
    createTrackerCommand(),
    createDiceCommand(),
    createBankCommand(),
  ];

  return commands;
}