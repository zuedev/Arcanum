import { SlashCommandBuilder } from "discord.js";
import { DICE_TYPES } from '../../config/constants.js';

export function createDiceCommand() {
    const rollCommand = new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Roll some dice");

    // Add standard dice subcommands
    DICE_TYPES.forEach((sides) => {
        rollCommand.addSubcommand((sub) =>
            sub
                .setName(`d${sides}`)
                .setDescription(`Roll a d${sides}`)
                .addIntegerOption((opt) =>
                    opt.setName("quantity").setDescription("The quantity of dice to roll")
                )
        );
    });

    // Add custom dice subcommand
    rollCommand.addSubcommand((sub) =>
        sub
            .setName("dx")
            .setDescription("Roll a custom die")
            .addIntegerOption((opt) =>
                opt
                    .setName("sides")
                    .setDescription("The number of sides on the die")
                    .setRequired(true)
            )
            .addIntegerOption((opt) =>
                opt.setName("quantity").setDescription("The quantity of dice to roll")
            )
    );

    return rollCommand;
}