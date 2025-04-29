import { MongoClient } from "mongodb";
import { config } from "dotenv";
config();

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db(process.env.MONGO_DB_NAME);

export async function connectDB() {
  if (!client.topology?.isConnected()) await client.connect();
  return db;
}
