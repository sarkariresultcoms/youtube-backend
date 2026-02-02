import mongoose from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Users } from "lucide-react"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const isChannelSubscribed= await Subscription.findOne(
       {
        channel: channelId,
        subscriber: req.User._id
       }
    );

    if(!isChannelSubscribed)
    {
        const subscribe= await Subscription.create({
            channel: channelId,
            subscriber: req.User._id
        })

        if(subscribe)
            subscribe.isSubscribed=true;
    }
    else
    {
        const subscribe= await Subscription.deleteOne({
            _id:isChannelSubscribed._id
        })

        if(subscribe)
            subscribe.isSubscribed=false;
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribe,
            subscribe.isSubscribed? 
            "Channel Subscribed":
            "Channel Unsubscribed"
        )
    );

    
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscriberList= await Subscription.aggregate(
        [
            {
                $match:{
                    channel: channelId
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "subscriber"
                }
            },
            {
                $unwind: "$subscriber"
            },
            {
                $project:{
                    channel:"$subscriber._id",
                    fullName: "$subscriber.fullName",
                    username: "$subscriber.username",
                    email: "$subscriber.email",
                    avatar: "$subscriber.avatar",
                    coverImage: "$subscriber.coverImage",
                }
            }
        ]
    )

    if(!subscriberList || subscriberList.length==0)
    {
        return res.status(200).json(new ApiResponse(
            200,
            null,
            "No Subscriber"
        ))
    }
    
    return res.status(200).json(new ApiResponse(
    200,
    subscriberList,
    "Subscriber List Successfully fetched"
    ))
    
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const ChannelList= await Subscription.aggregate(
        [
            {
                $match:{
                    subscriber: subscriberId
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "channel"
                }
            },
            {
                $unwind: "$channel"
            },
            {
                $project:{
                    channel:"$channel._id",
                    fullName: "$channel.fullName",
                    username: "$channel.username",
                    email: "$channel.email",
                    avatar: "$channel.avatar",
                    coverImage: "$channel.coverImage",
                }
            }
        ]
    )

    if(!ChannelList || ChannelList.length==0)
        return res.status(200).json(new ApiResponse(
            200,
            null,
            "No Channel"
        ))

    
    return res.status(200).json(
        new ApiResponse(
            200,
            ChannelList,
            "Channel List Successfully Fetched"

        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}