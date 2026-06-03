import { Demographics } from "../models/demographics.js";
import { CampaignTarget } from "../models/campaignTarget.js";
import { Survey } from "../models/surveySchema.js";
import { hashAadhaar } from "../utils/hash.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parseCampaignExcel, buildQuery } from "../utils/campaign.js";
import fs from "fs-extra";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const uploadCampaignExcel = asyncHandler(async (req, res) => {
    const { surveyId } = req.params;

    if (!surveyId) {
        throw new ApiError(400, "surveyId required");
    }

    const survey = await Survey.findOne({ surveyId });
    if (!survey) {
        throw new ApiError(400, "Invalid SurveyId");
    }

    if (!req.file) {
        throw new ApiError(400, "Excel file required");
    }

    let parsedRows;

    try {
        const buffer = await fs.readFile(req.file.path);
        parsedRows = await parseCampaignExcel(buffer);

        await fs.remove(req.file.path);
    } catch (err) {
        await fs.remove(req.file.path);
        throw new ApiError(400, err.message);
    }

    if (!parsedRows.length) {
        throw new ApiError(400, "No valid rows found");
    }

    const docs = parsedRows.map((row) => ({
        surveyId: survey._id,
        userKey: hashAadhaar(row.aadhaarNo),
        phone: row.phone,
    }));

    try {
        await CampaignTarget.insertMany(docs, { ordered: false });
    } catch (err) {
        if (err.code !== 11000) throw err;
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            { count: docs.length },
            "Campaign targets uploaded successfully"
        )
    );
});

export const generateTargetsFromDemographics = asyncHandler(async (req, res) => {
    const { filters } = req.body;
    const { surveyId } = req.params;

    if (!surveyId || !filters) {
        throw new ApiError(400, "surveyId and filters required");
    }

    const survey = await Survey.findOne({ surveyId });
    if (!survey) {
        throw new ApiError(400, "Invalid SurveyId");
    }

    const query = buildQuery(filters);
    const users = await Demographics.find(query).select("userKey phone");

    if (!users.length) {
        throw new ApiError(404, "No users matched filters");
    }

    const docs = users.map((u) => ({
        surveyId: survey._id,
        userKey: u.userKey,
        phone: u.phone,
    }));

    try {
        await CampaignTarget.insertMany(docs, { ordered: false });
    } catch (err) {
        // ignore duplicates
    }

    return res.status(201).json(
        new ApiResponse(201, { count: docs.length }, "Targets generated")
    );
});