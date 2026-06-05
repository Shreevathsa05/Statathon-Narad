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

  if (survey.status !== "approved" && survey.status !== "active") {
    throw new ApiError(400, "Survey is not approved, cannot upload targets.");
  }

  if (!req.file) {
    throw new ApiError(400, "Excel file required");
  }

  if (survey.targetSource && survey.targetSource !== "excel") {
    throw new ApiError(
      400,
      "Targets already uploaded for survey. Cannot upload again.",
    );
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

  survey.accessType = "targeted";
  survey.targetSource = "excel";
  await survey.save();

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { count: docs.length },
        "Campaign targets uploaded successfully",
      ),
    );
});

export const generateTargetsFromDemographics = asyncHandler(
  async (req, res) => {
    const { filters } = req.body;
    const { surveyId } = req.params;

    if (!surveyId || !filters) {
      throw new ApiError(400, "surveyId and filters required");
    }

    const survey = await Survey.findOne({ surveyId });
    if (!survey) {
      throw new ApiError(400, "Invalid SurveyId");
    }

    if (survey.accessType && survey.accessType === "general") {
      throw new ApiError(400, "Survey is general, cannot generate targets.");
    }

    if (survey.status !== "approved" && survey.status !== "active") {
      throw new ApiError(400, "Survey is neither approved nor active, cannot upload targets.");
    }

    if (survey.targetSource === "excel") {
      throw new ApiError(
        400,
        "Targets already uploaded for survey. Cannot generate.",
      );
    }

    if (survey.targetSource === "generated") {
      throw new ApiError(400, "Targets already generated. Cannot regenerate.");
    }

    const query = buildQuery(filters);
    const users = await Demographics.find(query).select("aadhaarNo phone");

    if (!users.length) {
      throw new ApiError(404, "No users matched filters");
    }

    const docs = users.map((u) => ({
      surveyId: survey._id,
      userKey: u.aadhaarNo,
      phone: u.phone,
    }));

    try {
      await CampaignTarget.insertMany(docs, { ordered: false });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }

    survey.accessType = "targeted";
    survey.targetSource = "generated";
    await survey.save();

    return res
      .status(201)
      .json(new ApiResponse(201, { count: docs.length }, "Targets generated"));
  },
);

export const getCampaignTargets = asyncHandler(async (req, res) => {
  const { surveyId } = req.params;

  if (!surveyId) {
    throw new ApiError(400, "surveyId required");
  }

  const survey = await Survey.findOne({ surveyId });
  if (!survey) {
    throw new ApiError(400, "Invalid SurveyId");
  }

  const targets = await CampaignTarget.find({ surveyId: survey._id })
    .select("phone status createdAt")
    .limit(100);

  return res
    .status(200)
    .json(new ApiResponse(200, targets, "Targets fetched successfully"));
});

export const deleteCampaignTargets = asyncHandler(async (req, res) => {
  const { surveyId } = req.params;

  if (!surveyId) {
    throw new ApiError(400, "surveyId required");
  }

  const survey = await Survey.findOne({ surveyId });
  if (!survey) {
    throw new ApiError(400, "Invalid SurveyId");
  }

  if (survey.status === "active" || survey.status === "complete") {
    throw new ApiError(
      400,
      "Cannot delete targets for active or completed surveys.",
    );
  }

  await CampaignTarget.deleteMany({ surveyId: survey._id });

  survey.targetSource = null;
  survey.accessType = null;
  await survey.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Targets deleted successfully"));
});

export const makeGeneralAccess = asyncHandler(async (req, res) => {
  const { surveyId } = req.params;

  if (!surveyId) {
    throw new ApiError(400, "surveyId required");
  }

  const survey = await Survey.findOne({ surveyId });
  if (!survey) {
    throw new ApiError(400, "Invalid SurveyId");
  }

  if (survey.status === "active" || survey.status === "complete") {
    throw new ApiError(
      400,
      "Cannot change access type for active or completed surveys.",
    );
  }

  const users = await Demographics.find({}).select("aadhaarNo phone");
  if (users.length > 0) {
    const docs = users.map((u) => ({
      surveyId: survey._id,
      userKey: u.aadhaarNo,
      phone: u.phone,
    }));

    try {
      await CampaignTarget.insertMany(docs, { ordered: false });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }

  survey.accessType = "general";
  await survey.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: users.length },
        "Survey access updated to general",
      ),
    );
});
