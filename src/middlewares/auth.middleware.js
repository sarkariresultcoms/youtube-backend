import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

const VerifyJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.cookies?.accessToken || req.headers("authorization").replace('Bearer ', '');
    
    if (!authHeader) 
        throw new ApiError(401, "Access token is missing");

    const decoded = jwt.verify(authHeader, process.env.ACCESS_TOKEN_SECRET);

    console.log("Decoded JWT:", decoded);
    
    await User.findById(decoded?._id).select("-password -refreshToken").then(user => {
        if (!user) {
            throw new ApiError(404, "User not found");
        } 
        req.user = user;
        next();
    }).catch(err => {
        throw new ApiError(401, "Invalid access token", err);
    });
}); 

export { VerifyJWT };