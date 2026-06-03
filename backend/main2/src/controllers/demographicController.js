import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Demographics } from "../models/demographics.js";

import { hashAadhaar } from "../utils/hash.js";

export const createDemographic = asyncHandler(async (req, res) => {
    const {
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

    const cleanAadhaar = aadhaarNo.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "");

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
        .json(new ApiResponse(201, demographic, "Demographic created successfully"));
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