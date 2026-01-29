import { summarizer } from "./uploader.js";

export async function buildPromptFromDocs(rawDocs, customprompt) {
    await summarizer(rawDocs);
}