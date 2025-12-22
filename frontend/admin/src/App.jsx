import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import GeneratorValidator from "./pages/Generator_validator";

export default function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/generator" />} />

      {/* Survey Generator + Validator */}
      <Route
        path="/generator"
        element={<GeneratorValidator />}
      />

      {/* Fallback */}
      <Route
        path="*"
        element={<div style={{ padding: 20 }}>Page not found</div>}
      />
    </Routes>
  );
}
