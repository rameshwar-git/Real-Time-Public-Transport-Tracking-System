import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI as string;

    if (!uri) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(uri);

    console.log("MongoDB connected to:", mongoose.connection.host);
    console.log("Database name:", mongoose.connection.name);
  } catch (error) {
    console.error("DB connection error", error);
    process.exit(1);
  }
};
