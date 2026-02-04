import mongoose from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    if(!req.content.trim())
        throw new ApiError(500, "Content is required");

    const newTweet= await Tweet.create({
       content: req.content,
       owner: req.user._id
    });
    if (!newTweet) {
        throw new ApiError(500, "Failed to create Tweet");
    }

    const tweetData = await User.findById(newTweet._id);
    return res.status(201).json(new ApiResponse(201, tweetData, "Tweeted successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        owner: { $first: "$owner" }
      }
    }
  ]);

    return res.status(201).json(new ApiResponse(201, userTweets, "All user tweets are fetched successfully"));

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}= req.param

     const {tweet} =req.body

    const tweetUpdate=  await Comment.findByIdAndUpdate(tweetId, { content: tweet }, { new: true }).select();
    
    if(!tweetUpdate)
        throw new ApiError(500, "Failed to Update Tweet");

    return res.status(201).json(new ApiResponse(201, tweetUpdate, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}= req.param

    const tweetDelete= await Tweet.deleteOne(tweetId);

    if(!tweetDelete)
          throw new ApiError(500, "Failed to delete tweet");

    return res.status(201).json(new ApiResponse(201, null, "Tweet deleted successfully"));

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}