import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const VerifyJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.cookies?.accessToken || req.headers("authorization").replace('Bearer ', '');
    
    if (!authHeader) 
        throw new ApiError(401, "Access token is missing");

    const decoded = jwt.verify(authHeader, process.env.ACCESS_TOKEN_SECRET);
    
    await User.findById(decoded?._id).select("-password -refreshToken").then(user => {
        if (!user) {
            throw new ApiError(404, "User not found");
        } 
        req.user = user;
        next;
    }).catch(err => {
        throw new ApiError(401, "Invalid access token", err);
    });
}); 

export { VerifyJWT };