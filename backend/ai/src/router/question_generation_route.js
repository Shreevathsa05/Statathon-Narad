// router for question generation
import { Router } from "express";
const question_generation_router = Router();

// health 
question_generation_router.get('/', (req, res) => {
    res.json("Question Generation Route Active")
})

question_generation_router.post('/generate_questions_english', async (req, res) => {
    const { user_query } = req.body;
    const q_bank_id = Math.floor(Math.random() * 14323432);
    const task = {
        type: "generate_questions_english",
        data: {
            query: user_query,
            id: q_bank_id
        }
    }
    await pushToQueue(task);
    res.json({ id: q_bank_id });
});

export default question_generation_router;