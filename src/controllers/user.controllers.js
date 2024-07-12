import asyncHendler from "../utils/asyncHendler.js";
import { User } from "../models/users.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import jwt from "jsonwebtoken";


const option = {
    httpOnly: true,
    secure: true
};


const generateAccessTokenAndRefreshAccessToken = async (userId) => {

    const user = await User.findById(userId);
    const asscessToken = user.generateAccessToken();
    const refreshToken = user.refreshAccessToken();

    user.refreshToken = refreshToken;

    await user.save();

    return { asscessToken, refreshToken };

}


const userRegister = asyncHendler(async (req, res) => {

    const { fullName, email, username, password } = req.body;


    const avatarLocalPath = req.files?.avatar[0]?.path;


    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );

});

const loginUser = asyncHendler(async (req, res) => {
    const { username, email, password } = req.body;

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(401, "user is font find");
    }

    const ispassworedValid = await user.isPasswordCorrect(password);

    if (!ispassworedValid) {//mdj@gmail.com 215421781441
        throw new ApiError(401, "password is not valid");
    }

    const { asscessToken, refreshToken } = await generateAccessTokenAndRefreshAccessToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    res.status(200)
        .cookie("asscessToken", asscessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(new ApiResponse(200,
            { asscessToken, loggedInUser, refreshToken },
            "User loggdin user succassfully")
        );

});

const logOutUser = asyncHendler(async (req, res) => {
    await User.findOneAndUpdate(
        req.user._id, {
        refreshToken: null,
        asscessToken: null
    }, {
        new: true
    });


    res.status(200)
        .clearCookie("asscessToken", option)
        .clearCookie("refreshToken", option)
        .json(
            new ApiResponse(
                200,
                {},
                "User log out user succassfully"
            )
        );
});

/**
 * @description re-genarate access token
 * @return response 
 */
const refreshAccessToken = asyncHendler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_ACCESS_TOKEN);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is invalid or expired");
        }

        const { asscessToken, refreshToken } = await generateAccessTokenAndRefreshAccessToken(user._id);

        res.status(200)
            .cookie("asscessToken", asscessToken, option)
            .cookie("refreshToken", refreshToken, option)
            .json(new ApiResponse(200,
                { asscessToken, refreshToken },
                "crated new asscessToken and refreshToken")
            );


    } catch (error) {
        throw new ApiError(500, "server error")
    }
})

const changeCurrentPassword = asyncHendler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        console.log(req.user?._id)
        const user = await User.findById(req.user?._id);

        if (!user) {
            throw new ApiError(401, "user id not find");
        }

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(401, "old password is correct");
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        return res.
            status(200).
            json(
                new ApiResponse(200,
                    { user },
                    "password is changed sessfull"
                ));

    } catch (err) {
        throw new ApiError(500, "inside server id");
    }
});

const getCurrentUser = asyncHendler(async (req, res) => {
    try {
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                req?.user,
                "User fetched successfully"
            ))
    } catch (error) {
        return res.status(200).json(new ApiError(500, "server error"))
    }
})

const updateAccountDetails = asyncHendler(async (req, res) => {
    const { email, fullName } = req.body;
    try {

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    email,
                    fullName
                }
            },
            { new: true }
        ).select("-password");

        if (!user) {
            throw new ApiError(400, "update faild");
        }

        return res.status(200).json(new ApiResponse(200, user, "Update"));

    } catch (error) {
        throw new ApiError(500, "server error");
    }

});

const updateUserAvatar = asyncHendler(async (req, res) => {
    try {
        const avatarLocalPath = req.file?.path;

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar.url) {
            throw new ApiError(400, "file upload faild");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            { new: true }
        ).select("-password");

        return res.status(200).json(new ApiResponse(200, user, "Update avator"));

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Server error");
    }

});

const updateUserCoverImage = asyncHendler(async (req, res) => {
    try {
        const coverImageLocalPath = req.file?.path;

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage.url) {
            throw new ApiError(400, "file upload faild");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    converImage: coverImage.url
                }
            },
            { new: true }
        ).select("-password");

        return res.status(200).json(new ApiResponse(200, user, "Update conver"));

    } catch (error) {
        throw new ApiError(500, "Server error");
    }

});

const getUserChannelProfile = asyncHendler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is not found");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribeTo"
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
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }

        }
    ]);
   
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )

});

export {
    userRegister,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
};