import { SlashCommandBuilder } from "@discordjs/builders";
import roll from "../library/roll.js";

export default {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll some dice")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("d20")
        .setDescription("Roll a d20")
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity of dice to roll")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("d12")
        .setDescription("Roll a d12")
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity of dice to roll")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("d10")
        .setDescription("Roll a d10")
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity of dice to roll")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("d100")
        .setDescription("Roll a pair of d10s for a d100")
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity of dice to roll")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("d8")
        .setDescription("Roll a d8")
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity of dice to roll")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("d6")
        .setDescription("Roll a d6")
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity of dice to roll")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("d4")
        .setDescription("Roll a d4")
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity of dice to roll")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("dx")
        .setDescription("Roll a custom die")
        .addIntegerOption((option) =>
          option
            .setName("sides")
            .setDescription("The number of sides on the die")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("The quantity of dice to roll")
        )
    ),
  async execute({ interaction }) {
    let quantity = 1;
    let sides = 20;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "dx") {
      sides = interaction.options.getInteger("sides");
      quantity = interaction.options.getInteger("quantity") ?? 1;
    } else {
      sides = parseInt(subcommand.substring(1));
      quantity = interaction.options.getInteger("quantity") ?? 1;
    }

    const { results, total } = roll(`${quantity}d${sides}`);

    const reply = `**Rolling \`${quantity}d${sides}\`...**\n${`\`${results.join(
      " + "
    )} = ${total}\``}`;

    if (reply.length > 2000) {
      return interaction.reply({
        content:
          "The result is too long to send as a message, here is a file instead.",
        files: [
          {
            attachment: Buffer.from(reply),
            name: "roll.md",
          },
        ],
      });
    }

    return interaction.reply(reply);
  },
};
