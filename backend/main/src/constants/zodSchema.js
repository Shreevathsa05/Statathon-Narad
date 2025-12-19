// import { z } from "zod";

// export const AllLanguages = [
//     "hindi",
//     "english",
//     "bengali",
//     "telugu",
//     "tamil",
//     "marathi",
//     "gujarati",
//     "kannada",
//     "malayalam",
//     "odia",
//     "punjabi",
//     "urdu",
// ];

// export function localizedTextSchema(languages) {
//     return z.object(
//         Object.fromEntries(
//             languages.map((lang) => [
//                 lang,
//                 z.string().min(1).describe(`Text in ${lang}`),
//             ])
//         )
//     );
// }

// const ShowIfSchema = z.object({
//     questionId: z.string().min(1),
//     equals: z.string().min(1),
// });

// export function surveySchemaForLanguages(languages) {
//     const LocalizedText = localizedTextSchema(languages);

//     const QuestionSchema = z.object({
//         qid: z.string().min(1),

//         // ❗ NO literal
//         type: z
//             .string()
//             .describe("Question type. Allowed value: mcq"),

//         text: LocalizedText,

//         options: z.array(
//             z.object({
//                 id: z.string().min(1),
//                 label: LocalizedText,
//             })
//         )
//             .min(2)
//             .max(5),

//         showIf: ShowIfSchema.optional(),
//     });

//     return z.object({
//         supportedLanguages: z
//             .array(
//                 z.string().describe(`Must be one of: ${languages.join(", ")}`)
//             )
//             .length(languages.length),

//         questions: z.array(QuestionSchema).min(1),
//     });
// }


//
//     ollama config
//

import { z } from "zod";

/* ---------------------------------- */
/* Supported Languages (global list)  */
/* ---------------------------------- */
export const AllLanguages = [
    "hindi",
    "english",
    "bengali",
    "telugu",
    "tamil",
    "marathi",
    "gujarati",
    "kannada",
    "malayalam",
    "odia",
    "punjabi",
    "urdu",
];

/* ---------------------------------- */
/* Localized Text (dynamic, strict)   */
/* ---------------------------------- */
export function localizedTextSchema(languages) {
    if (!Array.isArray(languages) || languages.length === 0) {
        throw new Error("At least one language must be provided");
    }

    return z
        .object(
            Object.fromEntries(
                languages.map((lang) => [lang, z.string().min(1)])
            )
        )
        .strict();
}

/* ---------------------------------- */
/* ShowIf (simple, deterministic)     */
/* ---------------------------------- */
const ShowIfSchema = z.object({
    questionId: z.string().min(1),
    equals: z.string().min(1),
});

/* ---------------------------------- */
/* Survey Schema Factory              */
/* ---------------------------------- */
export function surveySchemaForLanguages(languages) {
    if (!Array.isArray(languages) || languages.length === 0) {
        throw new Error("At least one language must be provided");
    }

    const invalid = languages.filter((l) => !AllLanguages.includes(l));
    if (invalid.length > 0) {
        throw new Error(`Unsupported language(s): ${invalid.join(", ")}`);
    }

    const LocalizedText = localizedTextSchema(languages);

    const QuestionSchema = z.object({
        qid: z.string().min(1),
        type: z.literal("mcq"),

        text: LocalizedText,

        options: z
            .array(
                z.object({
                    id: z.string().min(1),
                    label: LocalizedText,
                })
            )
            .min(2)
            .max(5),

        showIf: ShowIfSchema.optional(),
    });

    return z.object({
        supportedLanguages: z
            .array(z.enum(languages))
            .length(languages.length),

        questions: z.array(QuestionSchema).min(1),
    });
}
