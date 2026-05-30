// JSON Schemas to guide the AI for generating surveys that match the Mongoose model

export const englishQuestionArraySchema = {
    type: "array",
    minItems: 1,
    items: {
        type: "object",
        properties: {
            qid: { type: "string", description: "Unique question ID" },
            type: { type: "string", enum: ["mcq", "text", "checkbox"] },
            text: {
                type: "object",
                properties: { english: { type: "string" } },
                required: ["english"],
                description: "Question text wrapped in a language map"
            },
            options: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        label: {
                            type: "object",
                            properties: { english: { type: "string" } },
                            required: ["english"]
                        }
                    },
                    required: ["id", "label"]
                }
            },
            prefill: { type: "string" },
            showIf: {
                type: "object",
                properties: {
                    questionId: { type: "string", description: "Target question ID" },
                    equals: { type: "string", description: "Value that triggers this question" }
                },
                required: ["questionId", "equals"]
            }
        },
        required: ["qid", "type", "text"]
    }
};

export const multiLangQuestionArraySchema = {
    type: "array",
    minItems: 1,
    items: {
        type: "object",
        properties: {
            qid: { type: "string", description: "Unique question ID" },
            type: { type: "string", enum: ["mcq", "text", "checkbox"] },
            text: {
                type: "object",
                additionalProperties: { type: "string" },
                description: "Map of language code to translated question text (e.g., { 'english': '...', 'hindi': '...' })"
            },
            options: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        label: {
                            type: "object",
                            additionalProperties: { type: "string" },
                            description: "Map of language code to translated option label (e.g., { 'english': '...', 'hindi': '...' })"
                        }
                    },
                    required: ["id", "label"]
                }
            },
            prefill: { type: "string" },
            showIf: {
                type: "object",
                properties: {
                    questionId: { type: "string", description: "Target question ID" },
                    equals: { type: "string", description: "Value that triggers this question" }
                },
                required: ["questionId", "equals"]
            }
        },
        required: ["qid", "type", "text"]
    }
};

// 1. English Only JSON Schema
export const englishQuestionSchema = {
    type: "object",
    properties: {
        name: { type: "string", description: "Title of the survey" },
        categories: {
            type: "array",
            items: { type: "string" },
            minItems: 1
        },
        questionSections: {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                properties: {
                    sectionName: { type: "string" },
                    questions: englishQuestionArraySchema
                },
                required: ["sectionName", "questions"]
            }
        }
    },
    required: ["name", "categories", "questionSections"]
};


// 2. Multi-Language JSON Schema (Map Data Structure)
export const multiLangQuestionSchema = {
    type: "object",
    properties: {
        name: { type: "string", description: "Title of the survey" },
        categories: {
            type: "array",
            items: { type: "string" },
            minItems: 1
        },
        supportedLanguages: {
            type: "array",
            items: { type: "string", enum: ["hindi", "english", "bengali", "telugu", "tamil", "marathi", "gujarati", "kannada", "malayalam", "odia", "punjabi", "urdu"] },
            description: "List of languages generated for this survey"
        },
        questionSections: {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                properties: {
                    sectionName: { type: "string" },
                    questions: multiLangQuestionArraySchema
                },
                required: ["sectionName", "questions"]
            }
        }
    },
    required: ["name", "categories", "supportedLanguages", "questionSections"]
};

// Default export for backward compatibility
export default englishQuestionSchema;
