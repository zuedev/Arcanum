import { SlashCommandBuilder } from "discord.js";

export function createPingCommand() {
    return new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with pong!");
}