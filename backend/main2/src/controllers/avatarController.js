import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Survey } from "../models/surveySchema.js";
import { CampaignTarget } from "../models/campaignTarget.js";

export const triggerAvatarSurvey = asyncHandler(async (req, res) => {
    const { surveyId } = req.params;
    const { userId, language } = req.body;

    if (!surveyId) {
        throw new ApiError(400, "Survey id is required");
    }

    const survey = await Survey.findOne({ surveyId });
    if (!survey) {
        throw new ApiError(404, "Survey not found");
    }

    if (!survey.allowedChannels.includes("avatar") && survey.accessType !== "general") {
        throw new ApiError(403, "Avatar channel is not enabled for this survey");
    }

    // Placeholder logic for future FOD integration:
    // 1. Verify user exists in CampaignTarget if it's targeted.
    // 2. Generate a unique, short-lived magic link pointing directly to the Avatar mode.
    // 3. Dispatch SMS/Email/WhatsApp with the avatar-specific URL.
    // e.g., const avatarUrl = `${process.env.CITIZEN_URL}/survey/${surveyId}?mode=avatar&lang=${language}&uid=${userId}`;

    // For now, we return a success response simulating the dispatch.
    return res.status(200).json(
        new ApiResponse(200, { 
            status: "dispatched", 
            channel: "avatar",
            message: "Avatar survey trigger initiated successfully for FOD integration."
        }, "Avatar trigger successful")
    );
});
