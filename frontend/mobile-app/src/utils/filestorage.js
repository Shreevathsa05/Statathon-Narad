import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const DOWNLOADS_FILE_NAME = 'download.json';

function getFile() {
    return new File(Paths.document, DOWNLOADS_FILE_NAME);
}

export async function getDownloadedSurveys() {
    try {
        if (Platform.OS === 'web') {
            const content = localStorage.getItem(DOWNLOADS_FILE_NAME);
            if (!content) return [];
            return JSON.parse(content);
        }

        const file = getFile();
        if (!file.exists) {
            return [];
        }
        const content = file.textSync();
        if (!content) return [];
        return JSON.parse(content);
    } catch (e) {
        console.log("No downloaded surveys found or error reading", e);
        return [];
    }
}

export async function saveDownloadedSurvey(survey) {
    try {
        let surveys = [];

        if (Platform.OS === 'web') {
            try {
                const content = localStorage.getItem(DOWNLOADS_FILE_NAME);
                if (content) {
                    surveys = JSON.parse(content);
                }
            } catch (e) {
                console.log("Error parsing web local storage, resetting");
            }
        } else {
            const file = getFile();
            if (file.exists) {
                try {
                    const content = file.textSync();
                    if (content) {
                        surveys = JSON.parse(content);
                    }
                } catch (e) {
                    console.log("Error parsing download.json, resetting");
                }
            } else {
                file.create();
            }
        }

        // Check if already exists
        const existsIndex = surveys.findIndex((s) => s.surveyId === survey.surveyId);
        if (existsIndex === -1) {
            surveys.push(survey);
        } else {
            // Update existing
            surveys[existsIndex] = survey;
        }

        if (Platform.OS === 'web') {
            localStorage.setItem(DOWNLOADS_FILE_NAME, JSON.stringify(surveys));
        } else {
            const file = getFile();
            file.write(JSON.stringify(surveys));
        }

        return surveys;
    } catch (e) {
        console.error("Error saving survey", e);
        throw e;
    }
}

export async function deleteDownloadedSurvey(surveyId) {
    try {
        const surveys = await getDownloadedSurveys();
        const updatedSurveys = surveys.filter(s => s.surveyId !== surveyId);

        if (Platform.OS === 'web') {
            localStorage.setItem(DOWNLOADS_FILE_NAME, JSON.stringify(updatedSurveys));
        } else {
            const file = getFile();
            if (!file.exists) file.create();
            file.write(JSON.stringify(updatedSurveys));
        }

        return updatedSurveys;
    } catch (e) {
        console.error("Error deleting survey", e);
        throw e;
    }
}

const RESPONSES_FILE_NAME = 'responses.json';

function getResponsesFile() {
    return new File(Paths.document, RESPONSES_FILE_NAME);
}

export async function getSurveyResponses() {
    try {
        if (Platform.OS === 'web') {
            const content = localStorage.getItem(RESPONSES_FILE_NAME);
            if (!content) return [];
            return JSON.parse(content);
        }

        const file = getResponsesFile();
        if (!file.exists) {
            return [];
        }
        const content = file.textSync();
        if (!content) return [];
        return JSON.parse(content);
    } catch (e) {
        console.log("No saved responses found or error reading", e);
        return [];
    }
}

import { baseURI } from './constant';

export async function saveSurveyResponse(surveyId, responseData) {
    try {
        let responses = await getSurveyResponses();
        
        const newResponse = {
            id: Date.now().toString(),
            surveyId,
            responseData,
            completedAt: new Date().toISOString(),
            syncStatus: 'pending' // 'pending', 'synced', 'failed'
        };
        
        responses.push(newResponse);

        if (Platform.OS === 'web') {
            localStorage.setItem(RESPONSES_FILE_NAME, JSON.stringify(responses));
        } else {
            const file = getResponsesFile();
            if (!file.exists) file.create();
            file.write(JSON.stringify(responses));
        }

        return responses;
    } catch (e) {
        console.error("Error saving survey response", e);
        throw e;
    }
}

import * as Storage from './storage';

export async function updateSurveyResponse(responseId, surveyId, responseData) {
    try {
        let responses = await getSurveyResponses();
        const index = responses.findIndex(r => r.id === responseId);
        
        if (index !== -1) {
            responses[index] = {
                ...responses[index],
                surveyId,
                responseData,
                completedAt: new Date().toISOString(),
                syncStatus: 'pending' // Reset to pending to retry sync
            };
            
            if (Platform.OS === 'web') {
                localStorage.setItem(RESPONSES_FILE_NAME, JSON.stringify(responses));
            } else {
                const file = getResponsesFile();
                if (!file.exists) file.create();
                file.write(JSON.stringify(responses));
            }
        }
        
        return responses;
    } catch (e) {
        console.error("Error updating survey response", e);
        throw e;
    }
}

export async function syncResponses() {
    try {
        const responses = await getSurveyResponses();
        let updated = false;

        const token = await Storage.getItemAsync('accessToken');

        for (let i = 0; i < responses.length; i++) {
            const res = responses[i];
            
            if (res.syncStatus !== 'synced') {
                try {
                    const response = await fetch(`${baseURI}/api/response/${res.surveyId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify(res.responseData),
                    });

                    if (response.ok) {
                        responses[i].syncStatus = 'synced';
                        updated = true;
                    } else {
                        responses[i].syncStatus = 'failed';
                        updated = true;
                    }
                } catch (err) {
                    console.error(`Failed to sync response ${res.id}`, err);
                    responses[i].syncStatus = 'failed';
                    updated = true;
                }
            }
        }

        if (updated) {
            if (Platform.OS === 'web') {
                localStorage.setItem(RESPONSES_FILE_NAME, JSON.stringify(responses));
            } else {
                const file = getResponsesFile();
                if (!file.exists) file.create();
                file.write(JSON.stringify(responses));
            }
        }

        return responses;
    } catch (e) {
        console.error("Error during sync", e);
        throw e;
    }
}
