// router for question generation
import { Router } from "express";
const speech_conversion_router = Router();

// health 
speech_conversion_router.get('/',(req,res)=>{
    res.json("Speech Generation Route Active")
})

// ASI question generation end point

// HCES question generation

export default speech_conversion_router;