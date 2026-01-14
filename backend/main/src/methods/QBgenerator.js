import { type1prompt, type2prompt, type3prompt, type4prompt, outputSchema } from '../constants/promptTemplates.js'
import { surveySchemaForLanguages } from '../constants/zodSchema.js'
import { nativeModel } from '../constants/aimodels.js'


export async function generateQuestionsForType1(surveyObjective, householdType, recallPeriod, surveyLength, region, languages) {
    // languages is array
    const prompt_p1 = type1prompt(surveyObjective, householdType, recallPeriod, surveyLength, region, languages);
    const outputschema = outputSchema(languages);
    const final_prompt = prompt_p1 + outputschema;

    const res = await nativeModel.withStructuredOutput(surveySchemaForLanguages(languages)).invoke(final_prompt)
    return JSON.stringify(res);
}

export async function generateQuestionsForType2(surveyObjective, ageGroup, referencePeriod, sectorFocus, questionDepth, validationStrictness, interviewMode, languages) {

    const prompt_p1 = type2prompt(surveyObjective, ageGroup, referencePeriod, sectorFocus, questionDepth, validationStrictness, interviewMode, languages);
    const outputschema = outputSchema(languages);
    const final_prompt = prompt_p1 + outputschema;

    const res = await nativeModel.withStructuredOutput(surveySchemaForLanguages(languages)).invoke(final_prompt);
    return JSON.stringify(res);
}

export async function generateQuestionsForType3(assetCoverage, debtType, referencePeriod, sensitivityLevel, validationMode, privacyMode, languages) {

    const prompt_p1 = type3prompt(assetCoverage, debtType, referencePeriod, sensitivityLevel, validationMode, privacyMode, languages);
    const outputschema = outputSchema(languages);
    const final_prompt = prompt_p1 + outputschema;

    const res = await nativeModel.withStructuredOutput(surveySchemaForLanguages(languages)).invoke(final_prompt);
    return JSON.stringify(res);
}

export async function generateQuestionsForType4(enterpriseType, registrationStatus, industryClassification, enterpriseSize, accountingPeriod, dataSourceType, validationStrictness, languages) {


    const prompt_p1 = type4prompt(enterpriseType, registrationStatus, industryClassification, enterpriseSize, accountingPeriod, dataSourceType, validationStrictness, languages);
    const outputschema = outputSchema(languages);

    const final_prompt = prompt_p1 + outputschema;

    const res = await nativeModel.withStructuredOutput(surveySchemaForLanguages(languages)).invoke(final_prompt);
    return JSON.stringify(res);
}



//It was running directly on server start
// (
//     async()=>{
//         console.log(
//             await generateQuestionsForType1("get details on house owners and responsibilty awareness", "mixed", "null", "15 questions", "Suburban", ['hindi','english','marathi','kannada'])
//         )
//     }
// )()


//
//     ollama config
//

// import { type1prompt, type2prompt, type3prompt, type4prompt, outputSchema } from '../constants/promptTemplates.js'
// import { surveySchemaForLanguages } from '../constants/zodSchema.js'
// import { nativeModel } from '../constants/aimodels.js'

// export async function generateQuestionsForType1(surveyObjective, householdType, recallPeriod, surveyLength, region, languages) {
//     // languages is array
//     const prompt_p1 = type1prompt(surveyObjective, householdType, recallPeriod, surveyLength, region, languages);
//     const outputschema = outputSchema(languages);
//     const final_prompt = prompt_p1 + outputschema;
//     console.log(final_prompt)

//     const res = await nativeModel.withStructuredOutput(surveySchemaForLanguages(languages)).invoke(final_prompt)
//     console.log(await res)
//     return JSON.stringify(res);
// }

// export async function generateQuestionsForType2(surveyObjective, ageGroup, referencePeriod, sectorFocus, questionDepth, validationStrictness, interviewMode, languages) {

//     const prompt_p1 = type2prompt(surveyObjective, ageGroup, referencePeriod, sectorFocus, questionDepth, validationStrictness, interviewMode, languages);
//     const outputschema = outputSchema(languages);
//     const final_prompt = prompt_p1 + outputschema;

//     const res = await nativeModel.withStructuredOutput(surveySchemaForLanguages(languages)).invoke(final_prompt);
//     return JSON.stringify(res);
// }

// export async function generateQuestionsForType3(assetCoverage, debtType, referencePeriod, sensitivityLevel, validationMode, privacyMode, languages) {

//     const prompt_p1 = type3prompt(assetCoverage, debtType, referencePeriod, sensitivityLevel, validationMode, privacyMode, languages);
//     const outputschema = outputSchema(languages);
//     const final_prompt = prompt_p1 + outputschema;

//     const res = await nativeModel.withStructuredOutput(surveySchemaForLanguages(languages)).invoke(final_prompt);
//     return JSON.stringify(res);
// }

// export async function generateQuestionsForType4(enterpriseType, registrationStatus, industryClassification, enterpriseSize, accountingPeriod, dataSourceType, validationStrictness, languages) {


//     const prompt_p1 = type4prompt(enterpriseType, registrationStatus, industryClassification, enterpriseSize, accountingPeriod, dataSourceType, validationStrictness, languages);
//     const outputschema = outputSchema(languages);

//     const final_prompt = prompt_p1 + outputschema;

//     const res = await nativeModel.withStructuredOutput(surveySchemaForLanguages(languages)).invoke(final_prompt);
//     return JSON.stringify(res);
// }