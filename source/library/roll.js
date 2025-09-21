/**
 * Rolls a specified number of dice with a given number of sides and returns the results and total.
 *
 * @param {string} dice - The dice notation string (e.g., "2d6" for rolling two six-sided dice).
 * @returns {{ results: number[], total: number }} An object containing an array of individual roll results and their total sum.
 * @example
 * roll("3d4"); // { results: [2, 4, 1], total: 7 }
 */
export default function roll(dice) {
  const [quantity, sides] = dice.split("d").map((x) => parseInt(x));

  let results = [];
  let total = 0;

  for (let i = 0; i < quantity; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    results.push(roll);
    total += roll;
  }

  return {
    results,
    total,
  };
}
