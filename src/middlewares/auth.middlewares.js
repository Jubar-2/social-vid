import { User } from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHendler from "../utils/asyncHendler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHendler(async (req, _, next) => {
    try {
        const token = req.cookies?.asscessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unthorization request");
        }

        const decodedToken = jwt.verify(token,process.env.ACCESS_SECRET_TOKEN);

        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "invalid accass token");
        }

        req.user = user;

        next();

    } catch (error) {
        console.log(error);
        throw new ApiError(500, error?.message || "invalid access token");
    }
})