import fs from "fs-extra";
import path from "path";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const uploadDir = path.join(process.cwd(), "uploads", "campaigns");

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await fs.ensureDir(uploadDir);
            cb(null, uploadDir);
        } catch (err) {
            cb(new ApiError(500, "Failed to create upload directory"), null);
        }
    },

    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    if (!file.originalname.endsWith(".xlsx")) {
        return cb(new ApiError(400, "Only .xlsx files allowed"), false);
    }
    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});