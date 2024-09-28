import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Comment } from "../middlewares/comment.model.js";
import asyncHendler from "../utils/asyncHendler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHendler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video id is valid");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "video is not found");
    }

    const comment = Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentOwner",
                pipeline: [
                    {
                        $project: {
                            "username": 1,
                            "avatar": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$commentOwner"
            }
        }
    ]);

    const commentPaginate = await Comment.aggregatePaginate(comment, { page, limit });
    
    res.status(200).json(
        new ApiResponse(200, commentPaginate, "add commint successfully")
    );
})

const addComment = asyncHendler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video id not valid");
    }

    if (!content) {
        throw new ApiError(400, "content is empty");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "video is not find");
    }

    const addCommint = await Comment.create({
        content: content,
        video: new mongoose.Types.ObjectId(videoId),
        owner: req.user._id
    })

    res.status(200).json(
        new ApiResponse(200, addCommint, "add commint successfully")
    );

});

export {
    addComment,
    getVideoComments
}