import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { limit_size } from './constants.js';
import userRouter from './routes/user.route.js';
import subscriptionRouter from './routes/subscription.routes.js';
import videosRouter from './routes/video.routes.js'

const app = express();

app.use(cors({
    origin: process.env.cors_origin,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: limit_size }));
app.use(express.static("public"));
app.use(cookieParser());

//routers
app.use("/api/v1/user", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videosRouter);

export { app };

