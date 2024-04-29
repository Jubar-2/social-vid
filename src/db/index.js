import { connect } from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async () => {
    try {
      const connectionInstance = await connect(`${process.env.db_url}/${DB_Name}`);
       console.log(`MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log(`DB connection falid ${error}`);
        process.exit(1);
    }
}

export default connectDB;