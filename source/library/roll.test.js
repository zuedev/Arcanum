import roll from "./roll.js";

describe("roll", () => {
  test("should return correct number of results and total for 1d6", () => {
    const result = roll("1d6");
    expect(result.results.length).toBe(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(6);
  });

  test("should return correct number of results and total for 2d10", () => {
    const result = roll("2d10");
    expect(result.results.length).toBe(2);
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeLessThanOrEqual(20);
  });

  test("should return correct number of results and total for 3d20", () => {
    const result = roll("3d20");
    expect(result.results.length).toBe(3);
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeLessThanOrEqual(60);
  });

  test("should handle invalid input gracefully", () => {
    const result = roll("invalid");
    expect(result.results.length).toBe(0);
    expect(result.total).toBe(0);
  });

  test("should handle large quantities correctly", () => {
    const result = roll("1000d6");
    expect(result.results.length).toBe(1000);
    expect(result.total).toBeGreaterThanOrEqual(1000);
    expect(result.total).toBeLessThanOrEqual(6000);
    expect(result.results.every(r => r >= 1 && r <= 6)).toBe(true);
  });
});
