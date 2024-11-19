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
