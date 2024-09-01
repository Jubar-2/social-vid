import { Router } from 'express';
import { upload } from "../middlewares/multer.middleware.js"
import { getAllVideos, publishAVideo } from '../controllers/video.controller.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },

        ]),
        publishAVideo
    );


export default router;