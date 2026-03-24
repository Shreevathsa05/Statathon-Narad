// router for question generation
import { Router } from "express";
const question_generation_router = Router();

// health 
question_generation_router.get('/',(req,res)=>{
    res.json("Question Generation Route Active")
})

// ASI question generation end point

// HCES question generation

export default question_generation_router;