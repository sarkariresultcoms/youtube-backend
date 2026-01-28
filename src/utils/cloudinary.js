import {v2 as cloudinary} from "cloudinary";
import { extractPublicId } from 'cloudinary-build-url'  
import fs from "fs";

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath) => {     
    try {
        if (!filePath) {
            return null;
        }
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        }); 
        fs.unlinkSync(filePath); // Delete the local file after upload
        return result;

    } catch (error) {
        fs.unlinkSync(filePath);
        console.error("Cloudinary Upload Error:", error);
        return null;
    }       

};

const deleteFromCloudinary = async (cloudinaryUrl) => {     
    try {

        const cloudinaryPublicId= extractPublicId(cloudinaryUrl);
        
        if (!cloudinaryPublicId) {
            return null;
        }
        const result = await cloudinary.uploader.destroy(cloudinaryPublicId, {
            resource_type: "image", // specify the resource type if known
        }); 
        return result;

    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        return null;
    }       

};


export { uploadToCloudinary, deleteFromCloudinary };

