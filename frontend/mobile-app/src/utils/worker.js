import { syncResponses, getSurveyResponses } from './filestorage';
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

const RESPONSES_FILE_NAME = 'responses.json';

export async function clearSyncedResponses() {
    try {
        const responses = await getSurveyResponses();
        const pendingResponses = responses.filter(r => r.syncStatus !== 'synced');

        if (pendingResponses.length < responses.length) {
            console.log(`Clearing ${responses.length - pendingResponses.length} synced responses from memory...`);
            if (Platform.OS === 'web') {
                localStorage.setItem(RESPONSES_FILE_NAME, JSON.stringify(pendingResponses));
            } else {
                const file = new File(Paths.document, RESPONSES_FILE_NAME);
                if (!file.exists) file.create();
                file.write(JSON.stringify(pendingResponses));
            }
        } else {
            console.log('No synced responses to clear.');
        }
    } catch (e) {
        console.error('Error clearing synced responses', e);
    }
}

export async function autoSyncAndClear() {
    try {
        console.log('Starting auto sync...');
        await syncResponses();
        console.log('Sync completed. Proceeding to clear memory...');
        await clearSyncedResponses();
    } catch (e) {
        console.error('Error during auto sync and clear:', e);
    }
}

// Function to start the auto sync interval
export function startAutoSync(intervalMs = 60000) {
    console.log(`Initializing auto sync every ${intervalMs / 1000} seconds...`);
    
    // Initial sync
    autoSyncAndClear();

    // Set up periodic sync
    const intervalId = setInterval(() => {
        autoSyncAndClear();
    }, intervalMs);

    return intervalId;
}

export function stopAutoSync(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
        console.log('Auto sync stopped.');
    }
}