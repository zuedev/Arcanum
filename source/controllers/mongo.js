import { MongoClient } from "mongodb";

/**
 * Connects to the database.
 * This is called automatically by other functions.
 * You should not need to call this manually.
 *
 * @returns {Promise<MongoClient>} The connected MongoDB client
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
