import { CONFIG, ERROR_MESSAGES } from '../../config/constants.js';
import { validateNumber } from '../../utils/validation.js';

export function roll(diceNotation) {
  try {
    const parts = diceNotation.split("d");
    if (parts.length !== 2) {
      throw new Error("Invalid dice notation");
    }

    const quantity = validateNumber(
      parseInt(parts[0]),
      1,
      CONFIG.MAX_DICE_QUANTITY
    );
    const sides = validateNumber(parseInt(parts[1]), 1, CONFIG.MAX_DICE_SIDES);

    const results = [];
    let total = 0;

    for (let i = 0; i < quantity; i++) {
      const rollResult = Math.floor(Math.random() * sides) + 1;
      results.push(rollResult);
      total += rollResult;
    }

    return { results, total };
  } catch (error) {
    console.error("Error in roll function:", error);
    throw new Error("Invalid dice roll parameters");
  }
}

export function formatRollResult(quantity, sides, results, total) {
  const header = `**Rolling \`${quantity}d${sides}\`...**\n`;
  const resultString = `\`${results.join(" + ")} = ${total}\``;
  return header + resultString;
}

export async function performDiceRoll(quantity, sides) {
  const isLargeCalculation =
    quantity * sides > CONFIG.CHUNK_SIZE_CALCULATION_THRESHOLD;

  if (isLargeCalculation) {
    return await performChunkedRoll(quantity, sides);
  } else {
    return roll(`${quantity}d${sides}`);
  }
}

async function performChunkedRoll(quantity, sides) {
  const chunkSize = Math.min(100, Math.max(1, Math.floor(10000 / sides)));
  const results = [];
  let total = 0;

  for (let processed = 0; processed < quantity; processed += chunkSize) {
    const currentChunkSize = Math.min(chunkSize, quantity - processed);
    const chunkResult = roll(`${currentChunkSize}d${sides}`);

    results.push(...chunkResult.results);
    total += chunkResult.total;

    // Yield control periodically to prevent blocking
    if (processed % (chunkSize * 10) === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  return { results, total };
}

export async function handleRollCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  let quantity = interaction.options.getInteger("quantity") ?? 1;
  let sides;

  // Parse dice parameters
  if (subcommand === "dx") {
    sides = interaction.options.getInteger("sides");
  } else {
    sides = parseInt(subcommand.substring(1));
  }

  // Validate parameters
  try {
    quantity = validateNumber(quantity, 1, CONFIG.MAX_DICE_QUANTITY);
    sides = validateNumber(sides, 1, CONFIG.MAX_DICE_SIDES);
  } catch (error) {
    if (quantity > CONFIG.MAX_DICE_QUANTITY) {
      await interaction.editReply(ERROR_MESSAGES.MAX_DICE_EXCEEDED);
    } else if (sides > CONFIG.MAX_DICE_SIDES) {
      await interaction.editReply(ERROR_MESSAGES.MAX_SIDES_EXCEEDED);
    } else {
      await interaction.editReply(ERROR_MESSAGES.GENERIC_ERROR);
    }
    return;
  }

  // Perform the roll
  try {
    const rollResult = await performDiceRoll(quantity, sides);
    const message = formatRollResult(
      quantity,
      sides,
      rollResult.results,
      rollResult.total
    );

    if (message.length > CONFIG.DISCORD_MESSAGE_LIMIT) {
      await interaction.editReply({
        content:
          "The result is too long to send as a message, here is a file instead.",
        files: [
          {
            attachment: Buffer.from(message, "utf8"),
            name: "roll.md",
          },
        ],
      });
    } else {
      await interaction.editReply(message);
    }
  } catch (error) {
    console.error("Error performing dice roll:", error);
    await interaction.editReply(ERROR_MESSAGES.GENERIC_ERROR);
  }
}