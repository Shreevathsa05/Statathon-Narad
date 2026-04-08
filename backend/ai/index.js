import 'dotenv/config';
import app from './app.js';
const PORT = process.env.PORT || 3000;

import { Worker } from "worker_threads";

function runWorker(taskData) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./workers.js', { workerData: taskData });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => {
            if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
        });
    });
}

app.listen(PORT, async () => {
    console.log(`server listening on ${PORT}`);
    
    // Call the worker so it actually runs!
    try {
        console.log("Starting worker...");
        const result = await runWorker({ number: 5 });
        console.log("Worker returned result:", result);
    } catch (err) {
        console.error("Worker failed:", err);
    }
})
