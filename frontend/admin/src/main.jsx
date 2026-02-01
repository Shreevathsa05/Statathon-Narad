import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import AppRoutes from "./router";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
<BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
);
