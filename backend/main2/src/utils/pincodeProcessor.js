import mongoose from "mongoose";
import { SurveyResponse } from "../models/responsesSchema.js";

const DistrictMappingSchema = new mongoose.Schema({
    stateLGDCode: mongoose.Schema.Types.Mixed,
    state: String,
    districtLGDCode: mongoose.Schema.Types.Mixed,
    district: String,
    census_2011: mongoose.Schema.Types.Mixed
});

const DistrictMapping = mongoose.model("DistrictMapping", DistrictMappingSchema, "districtmappings");

export function normalizeName(str) {
    if (!str || typeof str !== "string") return "";
    return str
        .toLowerCase()
        .replace(/&/g, "and") // Replace '&' with 'and'
        .replace(/[^a-z0-9\s]/g, "") // Remove special characters
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();
}

export async function fetchPincodeData(pincode, cache = {}) {
    if (cache[pincode]) {
        return cache[pincode];
    }
    try {
        console.log(`[Pincode Processor] Fetching postal data for pincode: ${pincode}`);
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const result = {
                state: data[0].PostOffice[0].State,
                district: data[0].PostOffice[0].District
            };
            cache[pincode] = result;
            return result;
        }
        return null;
    } catch (error) {
        console.error(`[Pincode Processor] Failed to fetch data for pincode ${pincode}:`, error.message);
        return null;
    }
}

/**
 * Processes a single survey response by ID (used by the HTTP controller)
 */
export async function processResponsePincode(responseId) {
    try {
        const doc = await SurveyResponse.findById(responseId);
        if (!doc) {
            console.error(`[Pincode Processor] Response document not found: ${responseId}`);
            return;
        }

        // Extract pincode
        let pincode = doc.paraInfo?.locationInfo?.pincode;
        if (!pincode && doc.response && Array.isArray(doc.response)) {
            const pincodeAns = doc.response.find(r => r.qid && r.qid.toLowerCase() === "pincode");
            if (pincodeAns && pincodeAns.answer) {
                pincode = String(pincodeAns.answer).trim();
            }
        } else if (pincode) {
            pincode = String(pincode).trim();
        }

        if (!pincode) {
            return;
        }

        // Validate pincode format
        if (!/^\d{6}$/.test(pincode)) {
            console.warn(`[Pincode Processor] Invalid pincode format '${pincode}' for response ID: ${doc._id}`);
            return;
        }

        // Fetch postal data
        const postalData = await fetchPincodeData(pincode);
        if (!postalData) {
            console.warn(`[Pincode Processor] Could not resolve postal data for pincode '${pincode}' (ID: ${doc._id})`);
            return;
        }

        // Build robust case-insensitive query utilizing regex
        const cleanNameRegex = (name) => {
            const clean = name.replace(/&/g, "(and|&)").replace(/\s+/g, "\\s*");
            return new RegExp(`^${clean}$`, "i");
        };

        let matchedMapping = await DistrictMapping.findOne({
            district: cleanNameRegex(postalData.district),
            state: cleanNameRegex(postalData.state)
        });

        if (!matchedMapping) {
            // Fallback to district-only match
            matchedMapping = await DistrictMapping.findOne({
                district: cleanNameRegex(postalData.district)
            });
        }

        if (!matchedMapping) {
            console.warn(`[Pincode Processor] No LGD mapping match for district '${postalData.district}' (pincode: ${pincode}, ID: ${doc._id})`);
            return;
        }

        // Update document
        doc.paraInfo = doc.paraInfo || {};
        doc.paraInfo.locationInfo = doc.paraInfo.locationInfo || {};
        
        doc.paraInfo.locationInfo.stateLGDCode = String(matchedMapping.stateLGDCode);
        doc.paraInfo.locationInfo.districtLGDCode = String(matchedMapping.districtLGDCode);
        doc.paraInfo.locationInfo.state = matchedMapping.state;
        doc.paraInfo.locationInfo.district = matchedMapping.district;
        doc.paraInfo.locationInfo.pincode = pincode;
        
        if (matchedMapping.census_2011 != null) {
            doc.paraInfo.locationInfo.census_2011 = String(matchedMapping.census_2011).padStart(3, '0');
        }

        doc.markModified("paraInfo");
        await doc.save();
        console.log(`[Pincode Processor] Background processing complete for response: ${doc._id} | District: ${matchedMapping.district}`);

    } catch (error) {
        console.error(`[Pincode Processor] Error processing response ${responseId}:`, error);
    }
}

/**
 * Fetches all unprocessed responses and resolves them sequentially (used by the CLI script)
 */
export async function processAllUnprocessed() {
    // Load mappings
    const allMappings = await DistrictMapping.find({});
    console.log(`📦 Loaded ${allMappings.length} district mappings into memory.`);
    
    const mappingList = allMappings.map(m => ({
        doc: m,
        normDistrict: normalizeName(m.district),
        normState: normalizeName(m.state)
    }));

    // Find unprocessed responses (missing districtLGDCode)
    const unprocessedResponses = await SurveyResponse.find({
        $or: [
            { "paraInfo.locationInfo.districtLGDCode": { $exists: false } },
            { "paraInfo.locationInfo.districtLGDCode": null },
            { "paraInfo.locationInfo.districtLGDCode": "" }
        ]
    });

    console.log(`🔍 Found ${unprocessedResponses.length} unprocessed responses.`);

    let processedCount = 0;
    let skipCount = 0;
    const pincodeCache = {};

    for (const doc of unprocessedResponses) {
        // Extract pincode
        let pincode = doc.paraInfo?.locationInfo?.pincode;
        if (!pincode && doc.response && Array.isArray(doc.response)) {
            const pincodeAns = doc.response.find(r => r.qid && r.qid.toLowerCase() === "pincode");
            if (pincodeAns && pincodeAns.answer) {
                pincode = String(pincodeAns.answer).trim();
            }
        } else if (pincode) {
            pincode = String(pincode).trim();
        }

        if (!pincode) {
            skipCount++;
            continue;
        }

        // Validate pincode
        if (!/^\d{6}$/.test(pincode)) {
            console.warn(`⚠️ Invalid pincode '${pincode}' for survey response ID: ${doc._id}. Skipping.`);
            skipCount++;
            continue;
        }

        // Fetch postal data
        const postalData = await fetchPincodeData(pincode, pincodeCache);
        if (!postalData) {
            console.warn(`⚠️ Could not resolve postal data for pincode '${pincode}' (ID: ${doc._id}).`);
            skipCount++;
            continue;
        }

        const normApiDistrict = normalizeName(postalData.district);
        const normApiState = normalizeName(postalData.state);

        // Match mapping
        let matched = mappingList.find(m => m.normDistrict === normApiDistrict && m.normState === normApiState);
        if (!matched) {
            matched = mappingList.find(m => m.normDistrict === normApiDistrict);
        }

        if (!matched) {
            console.warn(`⚠️ Could not match API district '${postalData.district}' to any LGD mapping for pincode '${pincode}' (ID: ${doc._id}).`);
            skipCount++;
            continue;
        }

        // Update document
        doc.paraInfo = doc.paraInfo || {};
        doc.paraInfo.locationInfo = doc.paraInfo.locationInfo || {};
        
        doc.paraInfo.locationInfo.stateLGDCode = String(matched.doc.stateLGDCode);
        doc.paraInfo.locationInfo.districtLGDCode = String(matched.doc.districtLGDCode);
        doc.paraInfo.locationInfo.state = matched.doc.state;
        doc.paraInfo.locationInfo.district = matched.doc.district;
        doc.paraInfo.locationInfo.pincode = pincode;
        
        if (matched.doc.census_2011 != null) {
            doc.paraInfo.locationInfo.census_2011 = String(matched.doc.census_2011).padStart(3, '0');
        }

        doc.markModified("paraInfo");
        await doc.save();
        processedCount++;
        console.log(`✅ Processed ID ${doc._id} | Pincode: ${pincode} -> ${matched.doc.district}, ${matched.doc.state}`);
    }

    console.log(`\n🎉 Processing complete. Successfully updated: ${processedCount}. Skipped: ${skipCount}.`);
}
