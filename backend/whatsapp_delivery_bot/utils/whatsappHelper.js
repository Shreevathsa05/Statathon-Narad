import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const getWhatsAppUrl = () => {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "mock_whatsapp_id";
  return `https://graph.facebook.com/v18.0/${phoneId}/messages`;
};

const getHeaders = () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || "mock_whatsapp_token";
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};

const isMockMode = () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return !token || !phoneId || token.startsWith("mock") || phoneId.startsWith("mock");
};

/**
 * Send a simple text message.
 * @param {string} to - Recipient phone number
 * @param {string} text - Message body
 */
export const sendTextMessage = async (to, text) => {
  const formattedPhone = to.replace(/\D/g, "");
  const cleanPhone = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

  if (isMockMode()) {
    console.log(`[WHATSAPP OUTBOX] To: +${cleanPhone}\n💬 Text: ${text}\n---`);
    return true;
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "text",
    text: { body: text }
  };

  try {
    await axios.post(getWhatsAppUrl(), payload, { headers: getHeaders() });
    return true;
  } catch (error) {
    console.error(`[WhatsApp sendTextMessage Error] ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
};

/**
 * Send interactive quick reply buttons (Max 3 buttons).
 * @param {string} to - Recipient phone number
 * @param {string} text - Main body message
 * @param {Array} buttons - Array of { id, title } objects
 */
export const sendInteractiveButtons = async (to, text, buttons) => {
  const formattedPhone = to.replace(/\D/g, "");
  const cleanPhone = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

  // Trim title to 20 chars (WhatsApp limit)
  const formattedButtons = buttons.slice(0, 3).map((btn) => ({
    type: "reply",
    reply: {
      id: btn.id,
      title: btn.title.substring(0, 20)
    }
  }));

  if (isMockMode()) {
    const btnsStr = buttons.map(b => `[${b.title} (${b.id})]`).join("  ");
    console.log(`[WHATSAPP OUTBOX] To: +${cleanPhone}\n💬 Text: ${text}\n🔘 Buttons: ${btnsStr}\n---`);
    return true;
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text },
      action: {
        buttons: formattedButtons
      }
    }
  };

  try {
    await axios.post(getWhatsAppUrl(), payload, { headers: getHeaders() });
    return true;
  } catch (error) {
    console.error(`[WhatsApp sendInteractiveButtons Error] ${error.response?.data?.error?.message || error.message}`);
    // If interactive fails, fallback to sending plain text options
    const fallbackText = `${text}\n\nOptions:\n` + buttons.map(b => `- Reply "${b.title}"`).join("\n");
    return await sendTextMessage(to, fallbackText);
  }
};

/**
 * Send an interactive list message (Between 1 and 10 rows).
 * @param {string} to - Recipient phone number
 * @param {string} bodyText - Main body text
 * @param {string} buttonLabel - Label on the select menu button (Max 20 chars)
 * @param {string} sectionTitle - Header for the list section
 * @param {Array} rows - Array of { id, title, description }
 */
export const sendInteractiveList = async (to, bodyText, buttonLabel, sectionTitle, rows) => {
  const formattedPhone = to.replace(/\D/g, "");
  const cleanPhone = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

  // Format list rows (Max 10 rows)
  const formattedRows = rows.slice(0, 10).map((row) => ({
    id: row.id,
    title: row.title.substring(0, 24), // Max 24 chars
    description: row.description ? row.description.substring(0, 72) : "" // Max 72 chars
  }));

  if (isMockMode()) {
    const listStr = rows.map(r => `• ${r.title} (${r.id}) ${r.description ? `- ${r.description}` : ""}`).join("\n");
    console.log(`[WHATSAPP OUTBOX] To: +${cleanPhone}\n💬 Text: ${bodyText}\n📋 List (${buttonLabel} / ${sectionTitle}):\n${listStr}\n---`);
    return true;
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonLabel.substring(0, 20),
        sections: [
          {
            title: sectionTitle.substring(0, 50),
            rows: formattedRows
          }
        ]
      }
    }
  };

  try {
    await axios.post(getWhatsAppUrl(), payload, { headers: getHeaders() });
    return true;
  } catch (error) {
    console.error(`[WhatsApp sendInteractiveList Error] ${error.response?.data?.error?.message || error.message}`);
    // Fallback to plain text list
    const fallbackText = `${bodyText}\n\nList Options:\n` + rows.map(r => `- Reply "${r.title}"`).join("\n");
    return await sendTextMessage(to, fallbackText);
  }
};
