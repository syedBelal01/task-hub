import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: Date;
  googleTokens?: {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
  };
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    createdAt: { type: Date, default: Date.now },
    googleTokens: {
      access_token: { type: String },
      refresh_token: { type: String },
      expiry_date: { type: Number },
    },
  },
  { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);
