import client from './client';

export const surveyClient = {
  // Fetch all surveys (can filter by status on the backend if supported)
  getSurveys: () => client.get('/survey'),
  
  // Get a single survey by its surveyId string
  getSurveyById: (surveyId) => client.get(`/survey/${surveyId}`),
  
  // Create an empty framework survey manually
  createSurvey: (payload) => client.post('/survey', payload),

  // Patch a survey (e.g., updating sections manually)
  updateSurvey: (surveyId, payload) => client.patch(`/survey/${surveyId}`, payload),
  
  // Approve a survey (updates status to 'approved')
  approveSurvey: (surveyId) => client.patch(`/survey/${surveyId}`, { status: 'approved' }),
};
