import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import GeneratorValidator from "./pages/Generator_validator";
import SurveyViewer from "./pages/SurveyViewer";
import Navbar from "./components/layout/Navbar";

export default function App() {
  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<GeneratorValidator />} />
          <Route path="/survey/:surveyId" element={<SurveyViewer />} />
        </Routes>
      </div>
    </>
  );
}
