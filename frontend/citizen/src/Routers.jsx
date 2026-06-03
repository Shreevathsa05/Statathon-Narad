import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";

import Home from "./pages/Home";
import SurveyPage from "./pages/SurveyPage";

export default function Routers() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<Home />} />
                    <Route path="survey/:surveyId" element={<SurveyPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}