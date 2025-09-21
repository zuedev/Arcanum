import { SlashCommandBuilder } from "discord.js";
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

    // Apply limits: max 100 dice, max 100 sides
    if (quantity > 100) {
      return interaction.editReply("❌ Maximum of 100 dice allowed per roll.");
    }

    if (sides > 100) {
      return interaction.editReply("❌ Maximum of 100 sides allowed per die.");
    }

    // For large calculations, process in chunks to avoid timeout
    const isLargeCalculation = quantity > 100 || (quantity * sides > 100000);

    if (isLargeCalculation) {
      // Process in chunks to avoid timeout
      const chunkSize = Math.min(100, Math.max(1, Math.floor(10000 / sides)));
      let results = [];
      let total = 0;

      for (let chunk = 0; chunk < quantity; chunk += chunkSize) {
        const currentChunkSize = Math.min(chunkSize, quantity - chunk);
        const chunkDice = `${currentChunkSize}d${sides}`;
        const chunkResult = roll(chunkDice);

        results = results.concat(chunkResult.results);
        total += chunkResult.total;

        // Yield control periodically to prevent blocking
        if (chunk % (chunkSize * 10) === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }

      const reply = `**Rolling \`${quantity}d${sides}\`...**\n${`\`${results.join(
        " + "
      )} = ${total}\``}`;

      if (reply.length > 2000) {
        return interaction.editReply({
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

      return interaction.editReply(reply);
    } else {
      // For small calculations, use the original fast path
      const { results, total } = roll(`${quantity}d${sides}`);

      const reply = `**Rolling \`${quantity}d${sides}\`...**\n${`\`${results.join(
        " + "
      )} = ${total}\``}`;

      if (reply.length > 2000) {
        return interaction.editReply({
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

      return interaction.editReply(reply);
    }
  },
};
