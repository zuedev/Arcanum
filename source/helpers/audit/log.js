import { connect } from "../../controllers/mongo.js";

export default async ({ channelId, message }) => {
  const mongo = await connect();

  const data = await mongo
    .db("LootTracker")
    .collection(`audit`)
    .insertOne({ channelId, message, timestamp: new Date() });

  await mongo.close();

  return data;
};
