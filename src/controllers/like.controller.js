import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHendler from "../utils/asyncHendler.js";
import { Comment } from "../middlewares/comment.model.js";

const toggleVideoLike = asyncHendler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video id is valid");
    }

    try {
        const video = await Video.findOne(
            {
                _id: videoId,
            }
        );

        if (!video) {
            throw new ApiError(400, "video id is valid");
        }

        const likeVideo = await Like.findOne({
            video: videoId,
            likedBy: req.user._id
        });

        if (likeVideo) {
            const deleted = await Like.findOneAndDelete(likeVideo._id);

            if (deleted) {
                return res.status(200).json(
                    new ApiResponse(200, { liked: false }, "removed like")
                )
            }
        }

        await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        return res.status(200).json(
            new ApiResponse(200, { liked: true }, "liked")
        )
    } catch (error) {
        throw new ApiError(500, "server error");
    }
});

const toggleCommentLike = asyncHendler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "video id is valid");
    }

    try {
        const comment = await Comment.findOne(
            {
                _id: commentId,
            }
        );

        if (!comment) {
            throw new ApiError(400, "comment id is valid");
        }

        const likeComment = await Comment.findOne({
            comment: commentId,
            likedBy: req.user._id
        });

        if (likeComment) {
            const deleted = await Comment.findOneAndDelete(likeVideo._id);

            if (deleted) {
                return res.status(200).json(
                    new ApiResponse(200, { liked: false }, "removed like")
                )
            }
        }

        await Comment.create({
            comment: commentId,
            likedBy: req.user._id
        })

        return res.status(200).json(
            new ApiResponse(200, { liked: true }, "liked")
        )
    } catch (error) {
        throw new ApiError(500, "server error");
    }

})

const toggleTweetLike = asyncHendler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "video id is valid");
    }

    try {
        const comment = await Comment.findOne(
            {
                _id: tweetId,
            }
        );

        if (!comment) {
            throw new ApiError(400, "comment id is valid");
        }

        const likeComment = await Comment.findOne({
            comment: tweetId,
            likedBy: req.user._id
        });

        if (likeComment) {
            const deleted = await Comment.findOneAndDelete(likeVideo._id);

            if (deleted) {
                return res.status(200).json(
                    new ApiResponse(200, { liked: false }, "removed like")
                )
            }
        }

        await Comment.create({
            comment: tweetId,
            likedBy: req.user._id
        })

        return res.status(200).json(
            new ApiResponse(200, { liked: true }, "liked")
        )
    } catch (error) {
        throw new ApiError(500, "server error");
    }
}
)

const getLikedVideos = asyncHendler(async (req, res) => {

    //TODO: get all liked videos
    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: req?.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "userData",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$userData"
                    }

                ]
            }
        },
        {
            $unwind: "$videos"
        },
        {
            $project: {
                _id: 1,
                createdAt: 1,
                videos: 1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, videos, "liked")
    )
})

export {
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getLikedVideos
}