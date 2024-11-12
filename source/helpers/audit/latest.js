import { connect } from "../../controllers/mongo.js";

export default async ({ channelId, count }) => {
  const mongo = await connect();

  const data = await mongo
    .db("LootTracker")
    .collection(`audit`)
    .find({ channelId }, { projection: { _id: 0 } }, { limit: count })
    .sort({ timestamp: -1 })
    .toArray();

  await mongo.close();

  return data;
};
