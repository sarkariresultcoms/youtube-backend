import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

/*
import express from "express";
const app=express();

(async () => {
  try {
    await mongoose.connect('${process.env.MONGODB_URI}/${DB_NAME}')
    app.on("error", (err) => {
      console.error("Failed to connect to the database:", err);
      throw err;
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
})();
*/
