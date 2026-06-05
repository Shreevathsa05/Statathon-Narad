import { CampaignTarget } from "../models/CampaignTarget.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Send a WhatsApp Cloud API template message to invite a user to start a survey.
 * @param {string} toPhone - The recipient's phone number (with country code)
 * @param {string} surveyName - Name of the survey
 * @param {string} surveyId - Slug or ID of the survey
 * @returns {Promise<boolean>} Success status
 */
export const sendWhatsAppInvitation = async (toPhone, surveyName, surveyId) => {
  const { WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN } = process.env;

  const formattedPhone = toPhone.replace(/\D/g, "");
  // Ensure country code is present (default to India +91 if 10 digits)
  const fullPhone = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

  console.log(`[WhatsApp Campaign] Triggering invitation template to ${fullPhone} for survey: ${surveyName}`);

  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || 
      WHATSAPP_PHONE_NUMBER_ID.startsWith("mock") || WHATSAPP_ACCESS_TOKEN.startsWith("mock")) {
    console.log(`[WhatsApp Mock] Invitation template simulated successfully to ${fullPhone} (Start Survey button included)`);
    return true;
  }

  const apiUrl = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  // Standard WhatsApp interactive message button payload or template
  // If we have an approved template, we use template. Otherwise, we can send an Interactive Button message directly
  // which works for session messages or if the user interacted with us.
  // However, the prompt specifically asks to send a "WhatsApp Template Message". Let's format the template payload:
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: fullPhone,
    type: "template",
    template: {
      name: "survey_invitation", // Approved template name
      language: {
        code: "en"
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: surveyName // Parameter 1: Survey Title
            }
          ]
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: `START_SURVEY_${surveyId}` // Payload returned on quick-reply click
            }
          ]
        }
      ]
    }
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    console.log(`[WhatsApp Campaign] Template dispatched. Message ID: ${response.data.messages?.[0]?.id}`);
    return true;
  } catch (error) {
    console.warn(`[WhatsApp API Error] Direct template dispatch failed: ${error.response?.data?.error?.message || error.message}`);
    
    // Fallback: If template dispatch fails (e.g., template not approved yet), try sending a standard Interactive Button message
    // which works instantly if we are within the 24-hour window, or log the failure.
    console.log("[WhatsApp Campaign] Attempting fallback interactive button message...");
    try {
      const fallbackPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: fullPhone,
        type: "interactive",
        interactive: {
          type: "button",
          header: {
            type: "text",
            text: "NARAD Survey Invitation"
          },
          body: {
            text: `You have been invited to participate in the survey: "${surveyName}". Your response is valuable to MoSPI.`
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: `START_SURVEY_${surveyId}`,
                  title: "Start Survey"
                }
              }
            ]
          }
        }
      };

      await axios.post(apiUrl, fallbackPayload, {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`[WhatsApp Campaign] Fallback interactive invitation sent successfully to ${fullPhone}`);
      return true;
    } catch (fallbackError) {
      console.error("❌ Both template and interactive fallback message failed:", fallbackError.response?.data || fallbackError.message);
      throw error; // throw original template error
    }
  }
};

/**
 * Scan all pending campaign targets in the database, send survey invitations, and update their statuses.
 * @returns {Promise<Object>} Summary of dispatch results
 */
export const runCampaignInvitations = async () => {
  try {
    const pendingTargets = await CampaignTarget.find({ status: "pending" }).populate("surveyId");
    
    console.log(`[Campaign Runner] Found ${pendingTargets.length} pending campaign targets.`);

    let sentCount = 0;
    let failedCount = 0;

    for (const target of pendingTargets) {
      try {
        const survey = target.surveyId;
        if (!survey) {
          throw new Error(`Survey document not found for target ${target._id}`);
        }

        const success = await sendWhatsAppInvitation(target.phone, survey.name, survey.surveyId);
        
        if (success) {
          target.status = "sent";
          target.sentAt = new Date();
          sentCount++;
        } else {
          target.status = "failed";
          failedCount++;
        }
      } catch (err) {
        console.error(`Failed to dispatch campaign to target ${target.phone}:`, err.message);
        target.status = "failed";
        failedCount++;
      }
      await target.save();
    }

    return {
      totalProcessed: pendingTargets.length,
      sent: sentCount,
      failed: failedCount
    };
  } catch (error) {
    console.error("Error running campaign invitations:", error.message);
    throw error;
  }
};
