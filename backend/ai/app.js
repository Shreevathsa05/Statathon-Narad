import express from 'express';
import cors from 'cors';
import question_generation_router from './src/router/question_generation_route.js';
import speech_conversion_router from './src/router/speech_conversion.js';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
}));
app.use(express.json());

// question generation route
app.use('/question-generation', question_generation_router);
app.use('/speech', speech_conversion_router);

export default app;