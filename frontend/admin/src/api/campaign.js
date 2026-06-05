import client from "./client";

export const campaignClient = {
  uploadExcel: (surveyId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return client.post(`/campaign/upload/${surveyId}`, formData);
  },
  generateFromDemographics: (surveyId, filters) => {
    return client.post(`/campaign/generate/${surveyId}`, { filters });
  },
  getTargets: (surveyId) => {
    return client.get(`/campaign/targets/${surveyId}`);
  },
  deleteTargets: (surveyId) => {
    return client.delete(`/campaign/targets/${surveyId}`);
  },
  makeGeneralAccess: (surveyId) => {
    return client.post(`/campaign/general/${surveyId}`);
  },
};
