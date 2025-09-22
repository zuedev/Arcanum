import { SlashCommandBuilder } from "discord.js";
import { CURRENCY_TYPES, CURRENCY_ABBREVIATIONS } from '../../config/constants.js';

function getCurrencyChoices() {
    return CURRENCY_TYPES.map(currency => ({
        name: `${currency} (${CURRENCY_ABBREVIATIONS[currency]})`,
        value: currency
    }));
}

export function createBankCommand() {
    const bankCommand = new SlashCommandBuilder()
    .setName("bank")
    .setDescription("Manage currency for the current channel")
    .addSubcommandGroup((group) =>
      group
        .setName("dnd")
        .setDescription("D&D currency management")
        .addSubcommand((sub) =>
          sub
            .setName("deposit")
            .setDescription("Deposit D&D currency into the bank")
            .addStringOption((opt) =>
              opt
                .setName("currency")
                .setDescription("The type of currency")
                .setRequired(true)
                .addChoices(...getCurrencyChoices())
            )
            .addIntegerOption((opt) =>
              opt
                .setName("amount")
                .setDescription("The amount to deposit")
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("withdraw")
            .setDescription("Withdraw D&D currency from the bank")
            .addStringOption((opt) =>
              opt
                .setName("currency")
                .setDescription("The type of currency")
                .setRequired(true)
                .addChoices(...getCurrencyChoices())
            )
            .addIntegerOption((opt) =>
              opt
                .setName("amount")
                .setDescription("The amount to withdraw")
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub.setName("balance").setDescription("View the current D&D bank balance")
        )
        .addSubcommand((sub) =>
          sub
            .setName("clear")
            .setDescription("Clear all D&D currency from the bank")
        )
        .addSubcommand((sub) =>
          sub
            .setName("audit")
            .setDescription("View the audit log of D&D bank transactions")
            .addIntegerOption((opt) =>
              opt
                .setName("limit")
                .setDescription("Number of recent entries to show (default: 20, max: 100)")
                .setMinValue(1)
                .setMaxValue(100)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("convert")
            .setDescription("Convert D&D currency from one type to another")
            .addStringOption((opt) =>
              opt
                .setName("from")
                .setDescription("Currency to convert from")
                .setRequired(true)
                .addChoices(...getCurrencyChoices())
            )
            .addStringOption((opt) =>
              opt
                .setName("to")
                .setDescription("Currency to convert to")
                .setRequired(true)
                .addChoices(...getCurrencyChoices())
            )
            .addIntegerOption((opt) =>
              opt
                .setName("amount")
                .setDescription("Amount to convert")
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("setfee")
            .setDescription("Set D&D conversion fee rate (requires MANAGE_CHANNELS)")
            .addNumberOption((opt) =>
              opt
                .setName("rate")
                .setDescription("Fee rate as decimal (0.1 = 10%, 0.05 = 5%)")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(1)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("fees")
            .setDescription("View current D&D conversion fee settings")
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("decimal")
        .setDescription("Decimal currency management (USD, EUR, etc.)")
        .addSubcommand((sub) =>
          sub
            .setName("deposit")
            .setDescription("Deposit decimal currency into the bank")
            .addNumberOption((opt) =>
              opt
                .setName("amount")
                .setDescription("The amount to deposit (decimal)")
                .setRequired(true)
                .setMinValue(0.01)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("withdraw")
            .setDescription("Withdraw decimal currency from the bank")
            .addNumberOption((opt) =>
              opt
                .setName("amount")
                .setDescription("The amount to withdraw (decimal)")
                .setRequired(true)
                .setMinValue(0.01)
            )
        )
        .addSubcommand((sub) =>
          sub.setName("balance").setDescription("View the current decimal bank balance")
        )
        .addSubcommand((sub) =>
          sub
            .setName("clear")
            .setDescription("Clear all decimal currency from the bank")
        )
        .addSubcommand((sub) =>
          sub
            .setName("audit")
            .setDescription("View the audit log of decimal bank transactions")
            .addIntegerOption((opt) =>
              opt
                .setName("limit")
                .setDescription("Number of recent entries to show (default: 20, max: 100)")
                .setMinValue(1)
                .setMaxValue(100)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("setformat")
            .setDescription("Set currency format (requires MANAGE_CHANNELS)")
            .addStringOption((opt) =>
              opt
                .setName("prefix")
                .setDescription("Currency prefix (e.g., '$', '€', '£')")
                .setMaxLength(5)
            )
            .addStringOption((opt) =>
              opt
                .setName("suffix")
                .setDescription("Currency suffix (e.g., 'USD', 'EUR')")
                .setMaxLength(10)
            )
            .addBooleanOption((opt) =>
              opt
                .setName("prefix_space_after")
                .setDescription("Add space after prefix (e.g., '$ 123.45' vs '$123.45')")
            )
            .addBooleanOption((opt) =>
              opt
                .setName("suffix_space_before")
                .setDescription("Add space before suffix (e.g., '123.45 USD' vs '123.45USD')")
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("format")
            .setDescription("View current decimal currency format settings")
        )
    );
    return bankCommand;
}