// Shared configuration and constants for bank commands

export const CONFIG = {
  MAX_DICE_QUANTITY: 100,
  MAX_DICE_SIDES: 100,
  MAX_ITEM_NAME_LENGTH: 100,
  MIN_SEARCH_TERM_LENGTH: 2,
  SIMILARITY_THRESHOLD: 0.5,
  DISCORD_MESSAGE_LIMIT: 2000,
  TRACKER_MESSAGE_LIMIT: 1900,
  CHUNK_SIZE_CALCULATION_THRESHOLD: 100000,
  COLLECTION_NAMES: {
    TRACKERS: "trackers",
    TRACKER_AUDIT_LOG: "tracker_audit_log",
    BANK: "bank",
    BANK_AUDIT_LOG: "bank_audit_log",
    BANK_SETTINGS: "bank_settings",
  },
};

export const CURRENCY_TYPES = ["platinum", "gold", "silver", "electrum", "copper"];

export const CURRENCY_ABBREVIATIONS = {
  platinum: "pp",
  gold: "gp",
  silver: "sp",
  electrum: "ep",
  copper: "cp"
};

export const CURRENCY_TO_GOLD_CONVERSION = {
  platinum: 10,    // 1 pp = 10 gp
  gold: 1,         // 1 gp = 1 gp
  electrum: 0.5,   // 1 ep = 0.5 gp
  silver: 0.1,     // 1 sp = 0.1 gp
  copper: 0.01     // 1 cp = 0.01 gp
};

export const DEFAULT_CONVERSION_FEE = 0.1; // 10% default fee

export const ERROR_MESSAGES = {
  INVALID_QUANTITY: "The quantity must be an integer greater than 0.",
  ITEM_NAME_TOO_LONG: `Item name must be ${CONFIG.MAX_ITEM_NAME_LENGTH} characters or less.`,
  ITEM_NOT_FOUND: "Item not found in the tracker.",
  TRACKER_EMPTY: "The tracker is empty.",
  SEARCH_TERM_TOO_SHORT: `Search term must be at least ${CONFIG.MIN_SEARCH_TERM_LENGTH} characters long.`,
  NO_PERMISSION:
    "You must have the `MANAGE_CHANNELS` permission to clear the tracker.",
  MAX_DICE_EXCEEDED: `❌ Maximum of ${CONFIG.MAX_DICE_QUANTITY} dice allowed per roll.`,
  MAX_SIDES_EXCEEDED: `❌ Maximum of ${CONFIG.MAX_DICE_SIDES} sides allowed per die.`,
  INVALID_CURRENCY: `Invalid currency type. Valid currencies are: ${CURRENCY_TYPES.map(c => `${c} (${CURRENCY_ABBREVIATIONS[c]})`).join(", ")}.`,
  BANK_EMPTY: "The bank is empty.",
  INVALID_FEE_RATE: "Fee rate must be a number between 0 and 1 (0% to 100%).",
  SAME_CURRENCY_CONVERSION: "Cannot convert currency to the same type.",
  INSUFFICIENT_CONVERSION_BALANCE: "Insufficient balance for conversion.",
  GENERIC_ERROR: "An unexpected error occurred. Please try again.",
  DATABASE_ERROR: "An error occurred while accessing the database.",
};