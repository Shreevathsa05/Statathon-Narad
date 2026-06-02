export const aiClient = {
  async generateEnglishQuestions(user_query, improved_answers, survey_name) {
    const payload = { user_query };
    if (improved_answers) {
      payload.improved_answers = improved_answers;
    }
    if (survey_name) {
      payload.survey_name = survey_name;
    }
    
    const response = await fetch('/question-generation/generate_questions_english', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate questions: ${response.statusText}`);
    }
    return response.json();
  },

  async pollEnglishQuestions(surveyId) {
    const response = await fetch(`/question-generation/poll_questions_english/${surveyId}`);
    if (!response.ok) {
      throw new Error(`Failed to poll questions: ${response.statusText}`);
    }
    return response.json();
  },

  async improveSectionEnglish(surveyId, sectionName, instructions) {
    const response = await fetch('/question-generation/improve_section_english', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ surveyId, sectionName, instructions }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to improve section: ${response.statusText}`);
    }
    return response.json();
  },

  async generateQuestionsMultilang(surveyId, languages) {
    const response = await fetch('/question-generation/generate_questions_multilang', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ surveyId, languages }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to initiate translation: ${response.statusText}`);
    }
    return response.json();
  },

  async pollQuestionsMultilang(surveyId) {
    const response = await fetch(`/question-generation/poll_questions_multilang/${surveyId}`);
    if (!response.ok) {
      throw new Error(`Failed to poll translation: ${response.statusText}`);
    }
    return response.json();
  }
};
