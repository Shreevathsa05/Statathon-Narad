import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import GeneratorValidator from "./pages/Generator_validator";
import QuestionReview from "./pages/QuestionReview";
import FinalSurveyView from "./pages/FinalSurveyView";

function App() {
  return (
    <HashRouter>
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
    </HashRouter>
  );
}

export default App;
