import { SlashCommandBuilder } from "discord.js";
import alchemy from "../data/alchemy/index.js";
import calculateSimilarity from "../utilities/calculateSimilarity.js";

export default {
  data: new SlashCommandBuilder()
    .setName("alchemy")
    .setDescription("Perform alchemical operations.")
    .addSubcommandGroup((group) =>
      group
        .setName("lookup")
        .setDescription("Look up information about an alchemical item.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ingredient")
            .setDescription(
              "Look up information about an alchemical ingredient."
            )
            .addStringOption((option) =>
              option
                .setName("name")
                .setDescription("The name of the ingredient.")
                .setRequired(true)
            )
        )
    ),
  async execute({ interaction }) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    switch (subcommandGroup) {
      case "lookup":
        switch (subcommand) {
          case "ingredient":
            await lookupIngredient(interaction);
            break;
        }
        break;
    }
  },
};

async function lookupIngredient(interaction) {
  const name = interaction.options.getString("name");
  const ingredient = alchemy.ingredients.find(
    (i) => i.name.toLowerCase() === name.toLowerCase()
  );

  if (!ingredient) {
    // find the most similar ingredients and suggest them
    const similar = alchemy.ingredients
      .map((i) => ({
        ingredient: i,
        similarity: calculateSimilarity(
          name.toLowerCase(),
          i.name.toLowerCase()
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return await interaction.reply(
      `I couldn't find that ingredient. Did you mean one of these?\n${similar
        .map((s) => "- " + s.ingredient.name)
        .join("\n")}`
    );
  }

  await interaction.reply(`# ${ingredient.name}\n${ingredient.description}`);
}
