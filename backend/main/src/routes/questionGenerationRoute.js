import { Router } from "express";
import {generateCustomQuestions, generateQuestionsForType1,generateQuestionsForType2,generateQuestionsForType3,generateQuestionsForType4} from '../methods/QBgenerator.js'
import { AllLanguages } from "../constants/zodSchema.js";
import {loadDocument} from '../constants/uploader.js'
import {buildPromptFromDocs} from '../constants/promptBuilder.js'

const questionGenerationRouter = Router();

questionGenerationRouter.get("/", async (req, res) => {
    res.json("Working questionGenerationRoute");
});
questionGenerationRouter.get("/languages_supported", (req, res) => {
    res.send(AllLanguages);
});

questionGenerationRouter.get("/test", async (req, res) => {
    let ans;
    try {
        ans = await generateQuestionsForType1("get details on house owners and responsibilty awareness", "mixed", "null", "5 questions", "Suburban", ['hindi','english','marathi','kannada']);
        console.log(ans);
    } catch (error) {
        ans=error
    }
    // console.log(ans)
    res.send(ans);
});

questionGenerationRouter.post("/type1", async (req, res) => {

    let {surveyObjective, householdType, recallPeriod, surveyLength, region, languages}=req.body;

    let ans;
    try {
        ans = await generateQuestionsForType1(surveyObjective, householdType, recallPeriod, surveyLength, region, languages);
    } catch (error) {
        ans=error
    }
    // console.log(ans)
    res.send(ans);
});

questionGenerationRouter.post("/type2", async (req, res) => {

    let {surveyObjective, ageGroup, referencePeriod, sectorFocus, questionDepth, validationStrictness, interviewMode, languages}=req.body;

    let ans;
    try {
        ans = await generateQuestionsForType2(surveyObjective, ageGroup, referencePeriod, sectorFocus, questionDepth, validationStrictness, interviewMode, languages);
    } catch (error) {
        ans=error
    }
    // console.log(ans)
    res.send(ans);
});
questionGenerationRouter.post("/type3", async (req, res) => {

    let {assetCoverage, debtType, referencePeriod, sensitivityLevel, validationMode, privacyMode, languages}=req.body;

    let ans;
    try {
        ans = await generateQuestionsForType3(assetCoverage, debtType, referencePeriod, sensitivityLevel, validationMode, privacyMode, languages);
    } catch (error) {
        ans=error
    }
    // console.log(ans)
    res.send(ans);
});
questionGenerationRouter.post("/type4", async (req, res) => {

    let {enterpriseType, registrationStatus, industryClassification, enterpriseSize, accountingPeriod, dataSourceType, validationStrictness, languages}=req.body;

    let ans;
    try {
        ans = await generateQuestionsForType4(enterpriseType, registrationStatus, industryClassification, enterpriseSize, accountingPeriod, dataSourceType, validationStrictness, languages);
    } catch (error) {
        ans=error
    }
    // console.log(ans)
    res.send(ans);
});

questionGenerationRouter.post("/custom_generate_questions", async (req, res) => {
    try {
        const { customprompt, languages = ["english"] } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "File is required" });
        }
        if (!customprompt) {
            return res.status(400).json({ error: "customprompt is required" });
        }

        // Load document
        const rawDocs = await loadDocument(req.file.filename);

        // Generate questions
        const ans = await generateCustomQuestions(rawDocs, finalPrompt,languages);

        res.send(ans);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});


export default questionGenerationRouter;
