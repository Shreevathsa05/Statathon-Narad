import * as dotenv from 'dotenv';
dotenv.config();

import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { fileURLToPath } from "url";
import { nativeModel } from './aimodels';
import { summarizerSystemPrompt } from './promptTemplates';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadDocument(fileName) {
    const filePath = path.join(__dirname, "", fileName);

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(fileName).toLowerCase();
    let loader;
    let rawDocs = [];

    switch (ext) {
        case ".pdf":
            loader = new PDFLoader(filePath);
            rawDocs = await loader.load();
            break;

        case ".docx":
            loader = new DocxLoader(filePath);
            rawDocs = await loader.load();
            break;

        case ".doc":
            loader = new DocxLoader(filePath, { type: "doc" });
            rawDocs = await loader.load();
            break;

        case ".pptx":
            loader = new PPTXLoader(filePath);
            rawDocs = await loader.load();
            break;

        case ".txt":
            loader = new TextLoader(filePath);
            rawDocs = await loader.load();
            break;

        case ".csv":
            loader = new CSVLoader(filePath);
            rawDocs = await loader.load();
            break;

        case ".xls":
        case ".xlsx": {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);

            workbook.eachSheet((worksheet) => {
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    const values = row.values.slice(1); // remove empty index 0

                    rawDocs.push({
                        pageContent: values.map(v => String(v ?? "")).join(", "),
                        metadata: {
                            sheet: worksheet.name,
                            row: rowNumber
                        }
                    });
                });
            });

            break;
        }

        default:
            throw new Error(`Unsupported file type: ${ext}`);
    }

    console.log("Raw Docs:", rawDocs);

    return rawDocs;
}

export async function summarizer(rawDocs){
    const summary = await nativeModel.invoke(`${summarizerSystemPrompt}\n ${rawDocs}`);
    return summary.content
}