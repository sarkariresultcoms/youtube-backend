import asyncHandler from "express-async-handler"
import Video from "../models/video.model.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"
import { ApiError } from "../utils/ApiError.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];    
    
    if (!videoFile) {
        throw new Error("Video file is required");
    }
    if (!thumbnailFile) {
        throw new Error("Thumbnail file is required");  
    }
   
    const videoUploadResult = await uploadToCloudinary(videoFile.path);

    if (!videoUploadResult || !videoUploadResult.url) {
        throw new Error("Video upload failed");
    }

    const thumbnailUploadResult = await uploadToCloudinary(thumbnailFile.path); 
    if (!thumbnailUploadResult || !thumbnailUploadResult.url) {
        throw new Error("Thumbnail upload failed");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUploadResult?.url,
        thumbnail: thumbnailUploadResult?.url,
        duration: videoUploadResult?.duration,
        isPublished: true,
        owner: req.user._id
    });

    if (!video) {
        throw new Error("Failed to upload video");
    }
    return res.status(201).json({
        status: 201,
        data: video,
        message: "Video published successfully"
    });

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId);
    if (!video) {
        throw new Error("Video not found");
    }
    return res.status(200).json({
        status: 200,
        data: video,
        message: "Video fetched successfully"
    });
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const videoDetails = await Video.findById(videoId.trim());
    if (!videoDetails) {
        throw new Error("Video not found");
    }
    req.body.title = !req.body.title.trim() ? null : req.body.title;
    req.body.description = !req.body.description.trim() ? null : req.body.description;
    const thumbnailFile= req.file?.thumbnail?.path;   
    if (thumbnailFile) {
        const thumbnailUploadResult = await uploadToCloudinary(thumbnailFile);
        if (!thumbnailUploadResult || !thumbnailUploadResult.url) {
            throw new ApiError(500, "Thumbnail upload failed");
        }       
        req.body.thumbnail = thumbnailUploadResult?.url;
    }
    else {
        req.body.thumbnail = null;
    }
    const video = await Video.aggregate([
        { $match: { _id: videoId } },
        { 
            $cond: {
                if: { $ne: [req.body.title, null] },
                then: { $set: { title: req.body.title } },
                
                if: { $ne: [req.body.description, null] },
                then: { $set: { description: req.body.description } },

                if: { $ne: [req.body.thumbnail, null] },
                then: { $set: { thumbnail: req.body.thumbnail } },
         }
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,    
                views: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
            }       
        }
    ]);

    if (!video) {
        throw new Error("Failed to update video");
    }
    return res.status(200).json({
        status: 200,
        data: video,
        message: "Video updated successfully"
    });
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    const RemovedVideo = await video.remove();
    if (RemovedVideo) {
        const isDeleted = await deleteVideoFromCloudinary(video.videoFile);
        if (!isDeleted) {
            throw new ApiError(500, "Failed to delete video from cloudinary");
        }
    }
    return res.status(200).json({
        status: 200,
        message: "Video deleted successfully"
    });
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId);
    if (!video) {
        throw new Error("Video not found");
    }
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { isPublished: !video.isPublished },
        { new: true }
    );
    return res.status(200).json({
        status: 200,
        data: updatedVideo,
        message: "Video publish status toggled successfully"
    });
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}