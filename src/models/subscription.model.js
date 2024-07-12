import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref:"User"
    },

    channel: {
      type: Schema.Types.ObjectId,
      ref:"Uaser"
    },
  },
  {
    timestamps: true,
  }
);


export const Subscription = model("Subscription", subscriptionSchema);
