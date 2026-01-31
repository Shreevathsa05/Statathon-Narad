import { Routes, Route } from "react-router-dom";
import App from "./App";

import Home from "./pages/Home";
import GeneratorValidator from "./pages/Generator_validator";
import SurveyViewer from "./pages/SurveyViewer";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<GeneratorValidator />} />
        <Route path="/survey/:surveyId" element={<SurveyViewer />} />
      </Route>
    </Routes>
  );
}
