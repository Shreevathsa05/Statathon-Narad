import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
}));
app.use(express.json());

import surveyRoute from "./routes/surveyRoute.js";
import responseRoute from "./routes/responseRoute.js";

app.use('/api/survey', surveyRoute);
app.use('/api/response', responseRoute);

export default app;
