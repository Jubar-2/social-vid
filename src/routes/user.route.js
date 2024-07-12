import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, logOutUser, loginUser, refreshAccessToken, updateAccountDetails, updateUserAvatar, updateUserCoverImage, userRegister } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { addUserValidetion, addUserValidetionResult } from "../middlewares/validetion.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/registration").post( upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]),addUserValidetion, addUserValidetionResult, userRegister);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT,logOutUser);

router.route("/refreshAccessToken").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

export default router;