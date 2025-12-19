import express from 'express';
import cors from 'cors';
import generalrouter from './routes/general.js';
import questionGenerationRouter from './routes/questionGenerationRoute.js';

const app = express();

app.use(cors()); // fixed
app.use(express.json());

app.use('/',generalrouter);
app.use('/questions',questionGenerationRouter)

export default app;
