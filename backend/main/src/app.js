import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());

import surveyRoute from "./routes/surveyRoute.js";
import responseRoute from "./routes/responseRoute.js";
import generalrouter from './routes/general.js';
import questionGenerationRouter from './routes/questionGenerationRoute.js';
import dbRouter from './routes/dbRoute.js';

app.use('/api/survey', surveyRoute);
app.use('/api/response', responseRoute);
app.use('/', generalrouter);
app.use('/questions', questionGenerationRouter)
app.use('/db', dbRouter)

export default app;
