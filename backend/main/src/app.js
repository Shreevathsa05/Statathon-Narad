import express from 'express';
import cors from 'cors';
import generalrouter from './routes/general.js';
import questionGenerationRouter from './routes/questionGenerationRoute.js';
import dbRouter from './routes/dbRoute.js';

const app = express();

app.use(cors()); // fixed
app.use(express.json());

app.use('/',generalrouter);
app.use('/questions',questionGenerationRouter)
app.use('/db',dbRouter)

export default app;
