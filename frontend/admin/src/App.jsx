import { Routes, Route, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import GeneratorValidator from "./pages/Generator_validator";
import SurveyViewer from "./pages/SurveyViewer";
import Navbar from "./components/layout/Navbar";

export default function App() {
  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Outlet/>
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
        />
      </div>
    </>
  );
}
