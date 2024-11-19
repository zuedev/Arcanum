import { MongoClient } from "mongodb";

/**
 * Connect to MongoDB
 *
 * @returns {Promise<MongoClient>} A promise that resolves to a connected MongoClient
 *
 * @example
 * const mongo = await connect();
 *
 * // do something...
 *
 * await mongo.close(); // always close!
 */
export async function connect() {
  const mongo = new MongoClient(process.env.MONGODB_URI, {
    retryWrites: true,
    writeConcern: "majority",
  });

  await mongo.connect();

  return mongo;
}

export default { connect };
