import { CONFIG } from '../config/constants.js';

export async function migrateBankSettings(client, channel) {
  try {
    const settingsCollection = client
      .db()
      .collection(CONFIG.COLLECTION_NAMES.BANK_SETTINGS);

    // Check if settings exist
    const existingSettings = await settingsCollection.findOne({
      channel,
      type: 'dnd'
    });

    if (!existingSettings) {
      // Create default settings for DnD currency system
      await settingsCollection.insertOne({
        channel,
        type: 'dnd',
        conversionFee: 0.1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created default DnD bank settings for channel ${channel}`);
    }

    // Check if decimal settings exist
    const existingDecimalSettings = await settingsCollection.findOne({
      channel,
      type: 'decimal'
    });

    if (!existingDecimalSettings) {
      // Create default settings for decimal currency system
      await settingsCollection.insertOne({
        channel,
        type: 'decimal',
        prefix: '$',
        suffix: '',
        prefixSpaceAfter: false,
        suffixSpaceBefore: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created default decimal bank settings for channel ${channel}`);
    }
  } catch (error) {
    console.error("Failed to migrate bank settings:", error);
  }
}

export async function getBankFeeRate(client, channel) {
  const settingsCollection = client
    .db()
    .collection(CONFIG.COLLECTION_NAMES.BANK_SETTINGS);

  const settings = await settingsCollection.findOne({
    channel,
    type: 'dnd'
  });

  return settings?.conversionFee ?? 0.1;
}

export async function getDecimalCurrencyFormat(client, channel) {
  const settingsCollection = client
    .db()
    .collection(CONFIG.COLLECTION_NAMES.BANK_SETTINGS);

  const settings = await settingsCollection.findOne({
    channel,
    type: 'decimal'
  });

  return {
    prefix: settings?.prefix ?? '$',
    suffix: settings?.suffix ?? '',
    prefixSpaceAfter: settings?.prefixSpaceAfter ?? false,
    suffixSpaceBefore: settings?.suffixSpaceBefore ?? true
  };
}