import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import asyncHendler from "../utils/asyncHendler.js";


const getAllVideos = asyncHendler(async (req, res) => {

    try {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

        //TODO: get all videos based on query, sort, pagination

        const pipeline = [];

        if (query) {
            pipeline.push({
                $search: {
                    index: "search-videos",
                    text: {
                        query: query,
                        path: ["title", "description"]
                    }
                }
            })
        }

        if (userId) {

            if (!isValidObjectId(userId)) {
                throw new ApiError(400, "invalid user id");
            }

            pipeline.push({
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }

            });

        }

        if (sortBy && sortType) {
            pipeline.push({
                $sort: {
                    [sortBy]: sortBy === 'asc' ? 1 : -1
                }
            });
        } else {
            pipeline.push({
                $sort: {
                    createdAt: -1
                }
            });
        }

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userInfo",
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
                $unwind: {
                    path: "$userInfo"
                }
            }
        )


        const videoAggregate = await Video.aggregate(pipeline);

        const aggregatePagination = await Video.aggregatePaginate(videoAggregate, {
            limit: limit,
            page: page
        })

        res.status(200).json(
            new ApiResponse(200, aggregatePagination, "video fetched successfully")
        );

    } catch ($err) {
        throw new ApiError(400, "server error");
    }

});



const publishAVideo = asyncHendler(async (req, res) => {
    const { title, description } = req.body;

    // TODO: get video, upload to cloudinary, create video

    const videoFile = req.files?.videoFile[0]?.path;
    const thumbnail = req.files?.thumbnail[0]?.path;

    if (!videoFile || !thumbnail) {
        throw new ApiError(400, "video is required");
    }

    try {

        //upload thumble and video on cloudinary
        const uploadedVideo = await uploadOnCloudinary(videoFile);
        const uploadedThumbnail = await uploadOnCloudinary(thumbnail);

        if (!uploadedVideo) {
            throw new ApiError(400, "video is required");
        }

        if (!uploadedThumbnail) {
            throw new ApiError(400, "video is required");
        }

        const resObj = {
            videoFile: uploadedVideo.url,
            thumbnail: uploadedThumbnail.url,
            title: title,
            description: description,
            duration: uploadedVideo?.duration,
            owner: req.user?._id
        }

        const insertData = await Video.create(resObj);

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                insertData,
                "User fetched successfully"
            ))
    } catch (error) {
        throw new ApiError(500, "inside server id");
    }

});

export {
    publishAVideo,
    getAllVideos
}