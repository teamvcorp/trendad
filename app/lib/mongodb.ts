import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const options = {
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 30_000,
  connectTimeoutMS: 10_000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

// Reuse client across hot reloads in development
let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, options);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri, options);
}

export default client;

export function getDb() {
  return client.db("trendads");
}
