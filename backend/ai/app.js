import express from 'express';
import cors from 'cors';
import question_generation_router from './src/router/question_generation_route';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
}));
app.use(express.json());

// question generation route
app.use('/question-generation',question_generation_router);
app.use('/speech')

export default app;