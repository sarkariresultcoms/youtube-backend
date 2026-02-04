import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,

}));
app.use(express.json({
    limit: "16mb",
}));
app.use(express.urlencoded({
    extended: true,
    limit: "16mb",
}));
app.use(express.static("public"));
app.use(cookieParser());

//routes middleware will be here
import userRoutes from "./routes/user.routes.js";
app.use("/api/v1/users", userRoutes);

import videoRoutes from "./routes/video.routes.js";
app.use("/api/v1/videos", videoRoutes);

import tweetRoutes from "./routes/tweet.routes.js";
app.use("/api/v1/tweets", tweetRoutes);

import subscriptionRoutes from "./routes/subscription.routes.js";
app.use("/api/v1/subscriptions", subscriptionRoutes);

import likeRoutes from "./routes/like.routes.js";
app.use("/api/v1/likes", likeRoutes);

import commentRoutes from "./routes/comment.routes.js";
app.use("/api/v1/comments", commentRoutes);

import playlistRoutes from "./routes/playlist.routes.js";
app.use("/api/v1/playlists", playlistRoutes);

import dashboardRoutes from "./routes/dashboard.routes.js";
app.use("/api/v1/dashboard", dashboardRoutes);

export { app };