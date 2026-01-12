import { summarizer } from "./uploader";

export async function buildPromptFromDocs(rawDocs, customprompt) {
    await summarizer(rawDocs);
}