import { connect } from "../../controllers/mongo.js";

export default async ({ channelId, itemName, itemAmount }) => {
  const mongo = await connect();

  const data = await mongo
    .db("LootTracker")
    .collection(`items`)
    .findOneAndUpdate(
      { channelId, itemName },
      { $inc: { itemAmount } },
      { upsert: true, returnDocument: "after" }
    );

  await mongo.close();

  return data.modifiedCount === 0 ? itemAmount : data.itemAmount;
};
