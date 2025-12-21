import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import GeneratorValidator from "./pages/Generator_validator";
import QuestionReview from "./pages/QuestionReview";
import FinalSurveyView from "./pages/FinalSurveyView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<div>Home / List of surveys</div>}
          
        />

        {/* Survey Generator */}
        <Route
          path="/a"
          element={<GeneratorValidator />}
        />

        {/* Question Approval */}
        <Route
          path="/question-review"
          element={<QuestionReview />}
        />

        {/* Final Survey */}
        <Route
          path="/final-survey"
          element={<FinalSurveyView />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
