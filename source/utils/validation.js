import { CONFIG, CURRENCY_TYPES, CURRENCY_ABBREVIATIONS } from '../config/constants.js';

export function validateEnvironment() {
  const requiredEnvVars = ["DISCORD_BOT_TOKEN", "MONGODB_URI"];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is required!`);
    }
  }

  // Validate MongoDB URI contains database name
  if (!process.env.MONGODB_URI.match(/\/([a-zA-Z0-9-_]+)(\?|$)/)) {
    throw new Error(
      "MONGODB_URI must contain a database name! Example: mongodb+srv://user:password@cluster.mongodb.net/mydatabase"
    );
  }
}

export function validateAndSanitizeString(
  input,
  maxLength = CONFIG.MAX_ITEM_NAME_LENGTH
) {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  const sanitized = input.trim();

  if (sanitized.length === 0) {
    throw new Error("Input cannot be empty");
  }

  if (sanitized.length > maxLength) {
    throw new Error(`Input must be ${maxLength} characters or less`);
  }

  return sanitized;
}

export function validateCurrency(currency) {
  if (typeof currency !== "string") {
    throw new Error("Currency must be a string");
  }

  const normalizedCurrency = currency.toLowerCase().trim();

  if (!CURRENCY_TYPES.includes(normalizedCurrency)) {
    throw new Error(`Invalid currency type. Valid currencies are: ${CURRENCY_TYPES.map(c => `${c} (${CURRENCY_ABBREVIATIONS[c]})`).join(", ")}.`);
  }

  return normalizedCurrency;
}

export function validateFeeRate(feeRate) {
  if (typeof feeRate !== "number" || isNaN(feeRate) || feeRate < 0 || feeRate > 1) {
    throw new Error("Fee rate must be a number between 0 and 1 (0% to 100%).");
  }
  return feeRate;
}

export function validateNumber(value, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Value must be an integer between ${min} and ${max}`);
  }
  return value;
}