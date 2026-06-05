import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Demographics } from "../models/demographics.js";

import { hashAadhaar } from "../utils/hash.js";

export const createDemographic = asyncHandler(async (req, res) => {
    let {
        aadhaarNo,
        phone,
        fullName,
        age,
        gender,
        primaryLanguage,
        pincode,
        area,
    } = req.body;

    if (
        !aadhaarNo ||
        !phone ||
        !fullName ||
        age === undefined ||
        !gender ||
        !primaryLanguage ||
        !pincode ||
        !area
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const cleanAadhaar = String(aadhaarNo).replace(/\D/g, "");
    const cleanPhone = String(phone).replace(/\D/g, "");

    fullName = String(fullName).trim().toLowerCase();
    gender = String(gender).trim().toLowerCase();
    primaryLanguage = String(primaryLanguage).trim().toLowerCase();
    area = String(area).trim().toLowerCase();

    pincode = String(pincode).replace(/\D/g, "");

    if (cleanAadhaar.length !== 12) {
        throw new ApiError(400, "Invalid Aadhaar number");
    }

    if (cleanPhone.length !== 10) {
        throw new ApiError(400, "Invalid phone number");
    }

    if (pincode.length !== 6) {
        throw new ApiError(400, "Invalid pincode");
    }

    if (typeof age !== "number" || age < 0 || age > 120) {
        throw new ApiError(400, "Invalid age");
    }

    const userKey = hashAadhaar(cleanAadhaar);

    const demographic = await Demographics.create({
        aadhaarNo: userKey,
        phone: cleanPhone,
        fullName,
        age,
        gender,
        primaryLanguage,
        pincode,
        area,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, demographic, "Demographic created successfully")
        );
});

export const getDemographic = asyncHandler(async (req, res) => {
    const { uidType, val } = req.query;

    if (!uidType || !val) {
        throw new ApiError(400, "uidType and val are required");
    }

    let query;

    if (uidType === "aadhaar") {
        const cleanVal = val.replace(/\D/g, "");
        const userKey = hashAadhaar(cleanVal);
        query = { userKey };
    } else if (uidType === "phone") {
        const cleanVal = val.replace(/\D/g, "");
        query = { phone: cleanVal };
    } else {
        throw new ApiError(400, "Invalid uidType");
    }

    const demographic = await Demographics.findOne(query).select(
        "fullName age gender primaryLanguage pincode area"
    );

    if (!demographic) {
        throw new ApiError(404, "Demographic not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, demographic, "Demographic fetched successfully"));
});