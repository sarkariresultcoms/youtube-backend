import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import User from '../models/User.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';





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


export { resigterUser };