import mongoose from "mongoose";

const OTPVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true
    },
    otp: {
      type: String,
      required: true
    },
    expiryTime: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL Index: documents will expire at the value of expiryTime
    }
  },
  { timestamps: true, collection: "otp_verifications" }
);

export const OTPVerification = mongoose.model("OTPVerification", OTPVerificationSchema);
