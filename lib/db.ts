import mongoose from "mongoose";
import dns from "node:dns";

// Avoid querySrv ECONNREFUSED on Windows when system DNS fails to resolve Atlas SRV
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env");
}

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
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 15000,
      // Fixes ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR on Windows with Atlas
      family: 4,
      autoSelectFamily: false,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
