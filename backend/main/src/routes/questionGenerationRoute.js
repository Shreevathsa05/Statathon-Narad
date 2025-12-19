import { Router } from "express";
import {generateQuestionsForType1,generateQuestionsForType2,generateQuestionsForType3,generateQuestionsForType4} from '../methods/QBgenerator.js'
import { AllLanguages } from "../constants/zodSchema.js";

const questionGenerationRouter = Router();

questionGenerationRouter.get("/", async (req, res) => {
    res.json("Working questionGenerationRoute");
});
questionGenerationRouter.get("/languages_supported", async (req, res) => {
    res.send(await AllLanguages);
});

questionGenerationRouter.get("/test", async (req, res) => {
    let ans;
    try {
        ans = await generateQuestionsForType1("get details on house owners and responsibilty awareness", "mixed", "null", "15 questions", "Suburban", ['hindi','english','marathi','kannada']);
    } catch (error) {
        ans=error
    }
    // console.log(ans)
    res.send(ans);
});

questionGenerationRouter.get("/type1", async (req, res) => {

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

questionGenerationRouter.get("/type2", async (req, res) => {

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
questionGenerationRouter.get("/type3", async (req, res) => {

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
questionGenerationRouter.get("/type4", async (req, res) => {

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

export default questionGenerationRouter;
