import { Router } from 'express';
import {
    addComment,
    getVideoComments,
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").post(addComment).get(getVideoComments);

export default router;