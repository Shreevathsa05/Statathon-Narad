import ExcelJS from "exceljs";

export const buildQuery = (filters) => {
  const query = {};

  if (filters.gender) {
    query.gender = filters.gender.toLowerCase();
  }

  if (filters.primaryLanguage) {
    query.primaryLanguage = filters.primaryLanguage.toLowerCase();
  }

  if (filters.pincode) {
    if (Array.isArray(filters.pincode)) {
      query.pincode = { $in: filters.pincode };
    } else {
      query.pincode = filters.pincode;
    }
  }

  if (filters.age) {
    query.age = {};

    if (filters.age.min !== undefined) {
      query.age.$gte = filters.age.min;
    }

    if (filters.age.max !== undefined) {
      query.age.$lte = filters.age.max;
    }

    // remove empty object
    if (Object.keys(query.age).length === 0) {
      delete query.age;
    }
  }

  return query;
};

export const parseCampaignExcel = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("No worksheet found");
  }

  const headerRow = worksheet.getRow(1);

  const header1 = String(headerRow.getCell(1).value || "").trim();
  const header2 = String(headerRow.getCell(2).value || "").trim();

  if (header1 !== "aadhaarNo" || header2 !== "phone") {
    throw new Error("Invalid Excel format. Expected headers: aadhaarNo, phone");
  }

  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    let aadhaarRaw = row.getCell(1).value;
    let phoneRaw = row.getCell(2).value;

    if (typeof aadhaarRaw === "object") return;

    if (!aadhaarRaw) return;

    const cleanAadhaar = String(aadhaarRaw).replace(/\D/g, "");

    if (cleanAadhaar.length !== 12) return;

    const phone = phoneRaw ? String(phoneRaw).replace(/\D/g, "") : undefined;

    rows.push({
      aadhaarNo: cleanAadhaar,
      phone,
    });
  });

  if (!rows.length) {
    throw new Error("No valid rows found");
  }

  return rows;
};
