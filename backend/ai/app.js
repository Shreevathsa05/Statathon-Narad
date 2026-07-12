import express from 'express';
import cors from 'cors';
import question_generation_router from './src/router/question_generation_route.js';
import speech_conversion_router from './src/router/speech_conversion.js';
import client from 'prom-client';
import responseTime from 'response-time';

const app = express();

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const reqResTime = new client.Histogram({
    name: 'http_request_duration_time',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [1, 50, 100, 500, 800, 1000, 2000, 5000]
})


app.use(cors({
    origin: '*',
}));
app.use(express.json());
app.use(responseTime((req, res, time) => {
    reqResTime.observe({
        method: req.method,
        route: req.url,
        status_code: res.statusCode,
    }, time);
}));

// question generation route
app.use('/question-generation', question_generation_router);
app.use('/speech', speech_conversion_router);

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
});

export default app;