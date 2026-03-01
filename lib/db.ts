import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
if (global.mongoose === undefined) global.mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in .env");
  }

  if (!cached.promise) {
    // Set DNS servers to avoid SRV resolution issues
    try {
      const dns = await import("node:dns");
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
    } catch { }

    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
      autoSelectFamily: false,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
