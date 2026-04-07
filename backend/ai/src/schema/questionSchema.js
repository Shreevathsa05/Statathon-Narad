import { z } from "zod";

const questionSchema = {
    type: "object",
    properties: {
        questions: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    type: { type: "string", enum: ["mcq", "text", "checkbox"] },
                    question: { type: "string" },
                    options: {
                        type: "array",
                        minItems: 2,
                        maxItems: 5,
                        items: { type: "string" }
                    }
                },
                required: ["id", "type", "question"]
            }
        }
    },
    required: ["questions"]
};

// -----------------------------------------------------------------------------------------------------------
const Question = z.discriminatedUnion("type", [
    z.object({
        id: z.string(),
        type: z.literal("text"),
        question: z.string(),
    }),

    z.object({
        id: z.string(),
        type: z.literal("mcq"),
        question: z.string(),
        options: z.array(z.string()).min(2).max(5),
    }),

    z.object({
        id: z.string(),
        type: z.literal("checkbox"),
        question: z.string(),
        options: z.array(z.string()).min(2).max(5),
    }),
]);

const Section = z.object({
    sectionName: z.string(),
    questions: z.array(Question).min(1),
});

const SurveyGenSchema = z.object({
    categories: z.array(z.string()).min(1),

    questionSections: z.array(Section)
        .min(1)
        .max(3), // keep small for token safety
});

export { SurveyGenSchema };

export default questionSchema;
