import { app } from "./app.js";
import connectDB from "./db/index.js";

/** connection to DB and server listening */
connectDB()
    .then(() => { 
        app.listen(process.env.port || 8001, ()=>{
            console.log(`server is starting on port: ${process.env.port}`);
        })
    })
    .catch((err) => {
        console.log("DB connection error", err);
    });