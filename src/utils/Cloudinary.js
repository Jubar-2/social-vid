import { v2 as cloudinary } from "cloudinary";
import { error } from "console";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_NAME_API_KEY,
    api_secret: process.env.CLOUDINARY_NAME_API_SECRET
});


const uploadOnCloudinary = async (loaclFilePath) => {
    try {
        if (!loaclFilePath) return null;
        const response = await cloudinary.uploader.upload(loaclFilePath, {
            resource_type: "auto"
        });
        console.log("File upload on cloudinary", response.url)
        return response;
    } catch (err) {
        console.log(err)
        fs.unlinkSync(loaclFilePath);
        return null;
    }
}

const deleteUploadFileOncloudinary = async (publicId,resourceType) => {
    try {
        return await cloudinary.uploader.destroy(publicId,{
            resource_type: resourceType
        });

    } catch (err) {
        console.log(error)
        return null;
    }
}

export { uploadOnCloudinary, deleteUploadFileOncloudinary };