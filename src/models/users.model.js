import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      require: true,
      unique: true,
      lowecase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      require: true,
      unique: true,
      lowecase: true,
      trim: true,
    },

    fullName: {
      type: String,
      type: String,
      require: true,
      lowecase: true,
      trim: true,
    },

    avatar: {
      type: String,
      require: true,
    },

    converImage: {
      type: String,
    },

    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    password: {
      type: String,
      require: [true, "password is required"],
    },

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {

  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/** chack password */
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
return  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_SECRET_TOKEN,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
  );
}
userSchema.methods.refreshAccessToken = function () {
return  jwt.sign(
    {
      _id: this._id,

    },
    process.env.REFRESH_ACCESS_TOKEN,
    { expiresIn: process.env.REFRESH_ACCESS_EXPIRE }
  );
}

export const User = model("User", userSchema);
