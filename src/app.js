import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { limit_size } from './constants';
const app = express();

app.use(cors({
    origin: process.env.cors_origin,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({extended:true,limit:limit_size}));
app.use(express.static("public"));
app.use(cookieParser());

export { app };

