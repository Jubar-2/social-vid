import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteUploadFileOncloudinary } from "../utils/Cloudinary.js";
import asyncHendler from "../utils/asyncHendler.js";
import { ApiError } from "../utils/ApiError.js";


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

    } catch (err) {
        throw new ApiError(500, "server error");
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
            throw new ApiError(400, "thumbnail is required");
        }

        const resObj = {
            videoFile: {
                publicVideoUrl: uploadedVideo.public_id,
                videoUrl: uploadedVideo.url
            },
            thumbnail: {
                publicThumbnailUrl: uploadedThumbnail.public_id,
                imageUrl: uploadedThumbnail.url
            },
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
        console.log(error)
        throw new ApiError(500, "inside server id");
    }

});

const getVideoById = asyncHendler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    try {
        if (videoId) {

            if (!isValidObjectId(videoId)) {
                throw new ApiError(400, "video id is valid");
            }

            const video = await Video.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(videoId),
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "ownerInfo",
                        pipeline: [
                            {
                                $lookup: {
                                    from: "subscriptions",
                                    localField: "_id",
                                    foreignField: "channel",
                                    as: "subscribers"
                                }
                            },
                            {
                                $addFields: {
                                    subscriberCount: {
                                        $size: "$subscribers"
                                    },

                                    isSubscribed: {
                                        $cond: {
                                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                            then: true,
                                            else: false
                                        }
                                    }
                                }
                            },
                            {
                                $project: {
                                    subscriberCount: 1,
                                    isSubscribed: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: {
                        path: "$ownerInfo"
                    }
                },
                {
                    $project: {
                        thumbnail: 1,
                        videoFile: 1,
                        ownerInfo: 1,
                        duration: 1,
                        views: 1,
                        description: 1,
                        title: 1
                    }
                }
            ]);

            console.log(video)
            res.status(200).json(
                new ApiResponse(200, video, "video fetched successfully")
            );
        }
    } catch (err) {
        console.log(err)
    }

});

const updateVideo = asyncHendler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body;

    // console.log(description)
    try {

        const updatedValue = {};

        if (title) {
            updatedValue.title = title;
        }

        if (description) {
            updatedValue.description = description;
        }

        const thumbnail = req?.file?.path;

        if (thumbnail) {
            const data = await Video.findById(videoId);
            if (data?.videoFile.publicVideoUrl) {
                await deleteUploadFileOncloudinary(data?.thumbnail.publicThumbnailUrl, "image")
            }
            const uploadNawThumbnail = await uploadOnCloudinary(thumbnail);

            const thumbnailObj = updatedValue.thumbnail = {};
            thumbnailObj.publicThumbnailUrl = uploadNawThumbnail?.public_id;
            thumbnailObj.imageUrl = uploadNawThumbnail?.url;
        }

        const updateVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: updatedValue

            },
            {
                new: true
            }
        )

        res.status(200).json(
            new ApiResponse(200, updateVideo, "video fetched successfully")
        );
    } catch (err) {
        throw new ApiError(500, "video id is valid");
    }

});

const deleteVideo = asyncHendler(async (req, res) => {
    const { videoId } = req.params;

    //TODO: delete video
    try {
        const data = await Video.findById(videoId);

        if (!data) {
            throw new ApiError(400, "video id is valid");
        }

        const thumbnail = await deleteUploadFileOncloudinary(data?.thumbnail?.publicThumbnailUrl, "image");
        const video = await deleteUploadFileOncloudinary(data?.videoFile.publicVideoUrl, "video");

        if (thumbnail?.result !== 'ok' && video?.result !== 'ok') {
            throw new ApiError(400, "video id is valid");
        }

        const deletedVideo = await Video.findByIdAndDelete(videoId);

        res.status(200).json(
            new ApiResponse(200, deletedVideo, "video delete successfully")
        );
    } catch (error) {
        throw new ApiError(500, "video id is valid");
    }
});

const togglePublishStatus = asyncHendler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video id is valid");
    }

    try {
        const data = await Video.findById(videoId);

        if (!data) {
            throw new ApiError(400, "video id is valid");
        }

        if (req.user._id.toString() !== data.owner.toString()) {
            throw new ApiError(400, "this is not your video");
        }

        const updatedValue = {};

        if (data.isPublished) {
            updatedValue.isPublished = false;
        } else {
            updatedValue.isPublished = true;
        }

        const updatedData = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: updatedValue
            },
            {
                new: true
            }
        );

        res.status(200).json(
            new ApiResponse(200, updatedData, "video delete successfully")
        );
    } catch (error) {
        throw new ApiError(500, "server error");
    }
})

export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}