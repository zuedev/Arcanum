import { SlashCommandBuilder } from "discord.js";

export function createTrackerCommand() {
    return new SlashCommandBuilder()
        .setName("tracker")
        .setDescription("Manage trackers for the current channel")
        .addSubcommand((sub) =>
            sub
                .setName("add")
                .setDescription("Add something to the tracker")
                .addStringOption((opt) =>
                    opt
                        .setName("name")
                        .setDescription("The name of the thing to add")
                        .setRequired(true)
                )
                .addIntegerOption((opt) =>
                    opt
                        .setName("quantity")
                        .setDescription("The quantity to add")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove")
                .setDescription("Remove something from the tracker")
                .addStringOption((opt) =>
                    opt
                        .setName("name")
                        .setDescription("The name of the thing to remove")
                        .setRequired(true)
                )
                .addIntegerOption((opt) =>
                    opt
                        .setName("quantity")
                        .setDescription("The quantity to remove")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub.setName("list").setDescription("List all the things in the tracker")
        )
        .addSubcommand((sub) =>
            sub
                .setName("clear")
                .setDescription("Clear all the things from the tracker")
        )
        .addSubcommand((sub) =>
            sub
                .setName("search")
                .setDescription("Search for an item in the tracker")
                .addStringOption((opt) =>
                    opt
                        .setName("name")
                        .setDescription("The name of the thing to search for")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("rename")
                .setDescription("Rename an item in the tracker")
                .addStringOption((opt) =>
                    opt
                        .setName("old_name")
                        .setDescription("The current name of the item")
                        .setRequired(true)
                )
                .addStringOption((opt) =>
                    opt
                        .setName("new_name")
                        .setDescription("The new name for the item")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("audit")
                .setDescription("View the audit log of tracker changes")
                .addIntegerOption((opt) =>
                    opt
                        .setName("limit")
                        .setDescription("Number of recent entries to show (default: 20, max: 100)")
                        .setMinValue(1)
                        .setMaxValue(100)
                )
        );
}