import dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();

const client = new MongoClient(process.env.DATABASE_URI);

try {
  await client.connect();
} catch (error) {
  console.error(error);
}

export default client;
