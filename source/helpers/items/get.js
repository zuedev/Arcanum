import { connect } from "../../controllers/mongo.js";

export default async ({ channelId, itemName }) => {
  const mongo = await connect();

  const data = await mongo
    .db("LootTracker")
    .collection(`items`)
    .findOne({ channelId, itemName });

  await mongo.close();

  return data ? data.itemAmount : 0;
};
