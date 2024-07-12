import asyncHendler from "../utils/asyncHendler.js";
import { User } from "../models/users.model.js"
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const toggleSubscription = asyncHendler(async (req, res) => {

    const { channelId } = req.params;

    // TODO: toggle subscription

    try {
        const channel = await User.findById(channelId);

        if (!channel) {
            throw new ApiError(400, "channel is not found");
        }

        const subscriber = await Subscription.findOne({
            subscriber: req.user?._id,
            channel: channel?._id
        });

        let data;

        if (subscriber) {
            data = await Subscription.deleteOne({ subscriber: req.user?._id, channel: channel?._id });
        } else {
            data = await Subscription.create({
                subscriber: req.user?._id,
                channel: channel?._id
            });
        }

        return res.status(200).json(new ApiResponse(200, data, "work"));
    } catch (error) {
        throw new ApiError(500, "server error");
    }

});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHendler(async (req, res) => {
    const { channelId } = req.params;

    try {
        const channel = await User.findById(channelId);

        if (!channel) {
            throw new ApiError(400, "channel is not found");
        }

        const subscriber = await Subscription.find({
            channel: channel?._id
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, subscriber, "User channel fetched successfully")
            )

    } catch (err) {
        throw new ApiError(500, "server error");
    }

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHendler(async (req, res) => {
    const { subscriberId } = req.params;

    try {
        const subscriber = await User.findById(subscriberId);

        if (!subscriber) {
            throw new ApiError(400, "subscriber is not found");
        }

        const channel = await Subscription.find({
            subscriber: subscriber?._id
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, channel, "User channel fetched successfully")
            )

    } catch (err) {
        console.log(err)
        throw new ApiError(500, "server error");
    }
})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}