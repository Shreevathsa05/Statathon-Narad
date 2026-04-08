// worker.js
import { parentPort, workerData } from 'worker_threads';
import { popFromQueue, pushToQueue } from './src/redis/crud.js';
import generate_english_questions_retry from './src/utils/generate_questions.js';

console.log("[Worker Thread] Started scanning Redis...");

async function scanRedis() {
    try {
        const task = JSON.parse(await popFromQueue());
        if (task) {
            console.log("[Worker Thread] Popped task from Redis:", task);
        }
        if (task.type === "generate_questions_english") {
            const questions = await generate_english_questions_retry(task.data.query, task.data.id);
            if (questions) {
                console.log("[Worker Thread] Generated questions:", questions);
            }
        }



        // Post result back to main thread if you want to
        parentPort.postMessage({ status: 'processed' });
    } catch (error) {
        console.error("[Worker Thread] Error scanning Redis:", error);
    }
    setTimeout(scanRedis, 1000);
}

// Start the repetitive scanning loop
scanRedis();
