import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {User} from '../models/user.model.js';
import { uploadToCloudinary,deleteFromCloudinary } from '../utils/cloudinary.js';

const generateAcessAndRefreshToken = async(userId) => {
    // Implementation for generating access token
    // Implementation for generating refresh token 
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAcessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Token generation failed");
    } 
    
}  

const resigterUser = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;

    if (!username.trim() || !email.trim() || !fullName.trim() || !password.trim()) {
        throw new ApiError(400, "All fields are required");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        throw new ApiError(400, "Invalid email format");

    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (user) {
        throw new ApiError(409, "User already exists");
    }

    const avatarFilepath = req.files?.avatar[0]?.path;
    

    if (!avatarFilepath) {
        throw new ApiError(400, "Avatar is required");
    }
    const avatarUploadResult = await uploadToCloudinary(avatarFilepath);

    console.log("Avatar Upload Result:");
    console.log(avatarUploadResult);
    
    let coverImageurl="";
    if(Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        const coverImageFilepath = req.files?.coverImage[0]?.path;
        const coverImageUploadResult = await uploadToCloudinary(coverImageFilepath);
        coverImageurl=coverImageUploadResult?.url;
    }   

    
    const newUser = await User.create({
        username : username,
        email : email,      
        fullName  : fullName,
        password  : password,
        avatar: avatarUploadResult?.url ,
        coverImage: coverImageurl
    });

    if (!newUser) {
        throw new ApiError(500, "Failed to create user");
    }

    const userData = await User.findById(newUser._id).select("-password -refreshToken");
    return res.status(201).json(new ApiResponse(201, userData, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    //req body : email , password
    //username or email can be used for login
    //find user by email or username
    //check password
    //access token , refresh token
    //send cookies and response
    console.log("Login Request Body:", req.body);

    const { email, username, password } = req.body;
    if (!email.trim() || !username.trim()) {
        throw new ApiError(400, "Email or username is required");
    }
    if (!password.trim()) {
        throw new ApiError(400, "Password is required");
    }

    

    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }
    
    const tokens = await generateAcessAndRefreshToken(user._id);

    console.log("Generated Tokens:", tokens);

    const userData = await User.findById(user._id).select("-password -refreshToken");

    const cookieOptions = {
        httpOnly: true,
        secure: true
    };

    return res
    .cookie("accessToken", tokens.accessToken, cookieOptions)
    .cookie("refreshToken", tokens.refreshToken, cookieOptions)
    .status(200)
    .json(
        new ApiResponse(
            200, 
            { user: userData, accessToken: tokens.accessToken , refreshToken: tokens.refreshToken}, 
            "User logged in successfully"
        )
    ); 
});

const logoutUser = asyncHandler(async (req, res) => {
    
    // Implementation for user logout
    const {userId} = req.user._id;
    console.log("Logging out user with ID:", userId);
    await User.findByIdAndUpdate(userId, { $set: { refreshToken: null } }, { new: true, runValidators: false });

    const cookieOptions = {
        httpOnly: true,
        secure: true
    };
         
    return res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(new ApiResponse(200, null, "User logged out successfully"));  
});

const refreshAcessToken = asyncHandler(async (req, res) => {
    // Implementation for refreshing tokens
    const incomingrefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingrefreshToken) {
        throw new ApiError(401, "Refresh token is missing");
    }   
    const decoded = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    const user = await User.findById(decoded?._id).select("-password");       
    if (!user || user.refreshToken !== incomingrefreshToken) {      
        throw new ApiError(401, "Invalid refresh token");
    }
    const tokens = await generateAcessAndRefreshToken(user._id);

    const cookieOptions = {
        httpOnly: true,
        secure: true
    };  
    return res  
    .cookie("accessToken", tokens.accessToken, cookieOptions)
    .cookie("refreshToken", tokens.refreshToken, cookieOptions)
    .status(200)
    .json(
        new ApiResponse(
            200, 
            { accessToken: tokens.accessToken , refreshToken: tokens.refreshToken}, 
            "Access token refreshed successfully"
        )
    );  

});

const getUserProfile = asyncHandler(async (req, res) => {
    // Implementation for fetching user profile
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile fetched successfully"));
}); 

const changeUserPassword = asyncHandler(async (req, res) => {
    // Implementation for changing user password
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword.trim() || !newPassword.trim()) {
        throw new ApiError(400, "Old password and new password are required");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
        throw new ApiError(401, "Invalid old password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: true });
    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));   
});

const updateUserProfile = asyncHandler(async (req, res) => {
    // Implementation for updating user profile
    const { fullName } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }   
    if (fullName && fullName.trim()) {
        user.fullName = fullName;
    }
    await user.save();
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { fullName }, { new: true }).select("-password");
    return res.status(200).json(new ApiResponse(200, updatedUser, "User profile updated successfully"));  
}); 

const updateAvatar = asyncHandler(async (req, res) => {
    // Implementation for updating user avatar
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    } 
    
    const oldAvatarUrl = user.avatar;
    

    console.log("oldAvatarUrl",oldAvatarUrl);

    const avatarFilepath = req.file?.path;
    if (!avatarFilepath) {
        throw new ApiError(400, "Avatar file is required");
    }   
    const avatarUploadResult = await uploadToCloudinary(avatarFilepath);
    if (!avatarUploadResult?.url) {
        throw new ApiError(500, "Failed to upload avatar");
    }
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUploadResult?.url }, { new: true }).select("-password");
    if(updatedUser)
    {
        const deletedInfo =await deleteFromCloudinary(oldAvatarUrl);
        console.log("Old avatar deleted from Cloudinary:", deletedInfo);
    }
    return res.status(200).json(new ApiResponse(200, updatedUser, "User avatar updated successfully"));  
});

const updatecoverImage = asyncHandler(async (req, res) => {
    // Implementation for updating user cover image
    const user = await User.findById(req.user._id);     
    if (!user) {
        throw new ApiError(404, "User not found");
    }   
    const coverImageFilepath = req.file?.path;
    if (!coverImageFilepath) {
        throw new ApiError(400, "Cover image file is required");
    }
    const coverImageUploadResult = await uploadToCloudinary(coverImageFilepath);
    if (!coverImageUploadResult?.url) {
        throw new ApiError(500, "Failed to upload cover image");
    }
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { coverImage: coverImageUploadResult?.url }, { new: true }).select("-password");
    return res.status(200).json(new ApiResponse(200, updatedUser, "User cover image updated successfully"));  
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // Implementation for fetching user channel profile
    const { username } = req.params;
   
    const channel= await User.aggregate([   
        { $match: { username: username?.toLowerCase() } },
         {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
         },
         { $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribeTo"
         }
        },
        { $addFields: {
            subscriberCount: { $size: "$subscribers" },
            subscribeToCount: { $size: "$subscribeTo" },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user ? req.user._id : null, "$subscribers.Subscriber"] },
                    then: true,
                    else: false
                }
            }
         }
       },
         { $project: {  
            fullName: 1,
            username: 1,
            email: 1,
            avatar: 1,
            coverImage: 1,
            subscriberCount: 1,
            subscribeToCount: 1,
            isSubscribed: 1
         }} 
    ]);


    if (!channel || channel.length === 0) {
        throw new ApiError(404, "Channel not found");
    }
    return res.status(200).json(new ApiResponse(200, channel[0], "User channel profile fetched successfully"));

});

const getWatchHistory = asyncHandler(async (req, res) => {
    // Implementation for fetching user watch history
    const user = await User.findById(req.user._id).populate({ });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res.status(200).json(new ApiResponse(200, user.watchHistory, "User watch history fetched successfully"));
});







export { resigterUser, 
    loginUser , 
    logoutUser ,
    refreshAcessToken ,
    getUserProfile,
    changeUserPassword,
    updateUserProfile,
    updateAvatar,
    updatecoverImage,
    getUserChannelProfile,
    getWatchHistory
};