import { RespondentMaster } from "../models/RespondentMaster.js";
import { hashAadhaar } from "../../main2/src/utils/hash.js"; // Reuse existing hash function if possible, or define standard fallback

/**
 * Hashing helper for Aadhaar (in case we need to match or save hashed aadhaar).
 * @param {string} val 
 * @returns {string} Hashed value
 */
const hashAadhaarLocal = (val) => {
  try {
    return hashAadhaar(val);
  } catch {
    // Basic SHA256 fallback if import is not accessible
    import("crypto").then((crypto) => {
      return crypto.createHash("sha256").update(val).digest("hex");
    });
    return val; // fallback to plain value if crypto not resolved instantly (unlikely in node)
  }
};

const normalizePhone = (phone) => {
  const clean = phone.toString().replace(/\D/g, "");
  return clean.length > 10 ? clean.slice(-10) : clean;
};

/**
 * Look up a respondent by phone number in the master demographics database.
 * @param {string} phone 
 * @returns {Promise<Object|null>} The demographics profile if found, otherwise null
 */
export const lookupRespondent = async (phone) => {
  try {
    const cleanPhone = normalizePhone(phone);
    // Look up by clean phone number
    const respondent = await RespondentMaster.findOne({ phone: cleanPhone });
    if (!respondent) return null;

    // Convert mongoose document to standard object
    const profile = respondent.toObject ? respondent.toObject() : respondent;

    // Map fields cleanly to support both schema types
    return {
      fullname: profile.fullName || profile.fullname || "",
      age: profile.age || "",
      gender: profile.gender || "",
      primarylanguage: profile.primaryLanguage || profile.primarylanguage || "english",
      pincode: profile.pincode || "",
      area: profile.area || "",
      education: profile.demographicData?.education || profile.education || "",
      occupation: profile.demographicData?.occupation || profile.occupation || ""
    };
  } catch (error) {
    console.error(`Error looking up respondent ${phone}:`, error.message);
    throw error;
  }
};

/**
 * Save or update citizen demographic information in the master demographics collection.
 * @param {string} phone 
 * @param {Object} demographicData - Demographic fields (name, age, gender, primaryLanguage, pincode, area, education, occupation)
 * @returns {Promise<Object>} The saved demographics document
 */
export const saveRespondentDemographics = async (phone, demographicData) => {
  try {
    const cleanPhone = normalizePhone(phone);
    
    // Check if there is a UID/Aadhaar we should hash
    let aadhaarHash = undefined;
    if (demographicData.uid && (demographicData["uid-type"] === "aadhaar" || demographicData.uidType === "aadhaar")) {
      const cleanAadhaar = demographicData.uid.replace(/\D/g, "");
      aadhaarHash = hashAadhaarLocal(cleanAadhaar);
    } else {
      // If no Aadhaar, we can generate a unique key using the phone number
      aadhaarHash = hashAadhaarLocal(cleanPhone);
    }

    const updates = {
      phone: cleanPhone,
      aadhaarNo: aadhaarHash,
      fullName: demographicData.fullname || demographicData.fullName,
      age: parseInt(demographicData.age, 10) || undefined,
      gender: demographicData.gender,
      primaryLanguage: demographicData.primarylanguage || demographicData.primaryLanguage || "english",
      pincode: demographicData.pincode,
      area: demographicData.area,
      demographicData: {
        education: demographicData.education || "",
        occupation: demographicData.occupation || "",
        ...demographicData
      }
    };

    // Remove undefined fields
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const savedDoc = await RespondentMaster.findOneAndUpdate(
      { phone: cleanPhone },
      { $set: updates },
      { upsert: true, new: true }
    );

    return savedDoc;
  } catch (error) {
    console.error(`Error saving demographics for ${phone}:`, error.message);
    throw error;
  }
};
