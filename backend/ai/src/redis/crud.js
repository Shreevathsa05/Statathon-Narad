import client from "./connection.js";

const DEFAULT_QUEUE = "question_generation_queue";

// Queue operations (List)
export const pushToQueue = async (value, queueName = DEFAULT_QUEUE) => {
    try {
        const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await client.rPush(queueName, val);
        return true;
    } catch (error) {
        console.error("Redis pushToQueue error:", error);
        throw error;
    }
};

export const popFromQueue = async (queueName = DEFAULT_QUEUE) => {
    try {
        const val = await client.lPop(queueName);
        if (!val) return null;
        try {
            return JSON.parse(val);
        } catch {
            return val;
        }
    } catch (error) {
        console.error("Redis popFromQueue error:", error);
        throw error;
    }
};
