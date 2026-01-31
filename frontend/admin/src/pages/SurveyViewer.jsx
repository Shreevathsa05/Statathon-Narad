import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaTelegramPlane,
  FaWhatsapp,
  FaInstagram,
  FaCloudUploadAlt,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function SurveyViewer() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [lang, setLang] = useState("");
  const [editableTitle, setEditableTitle] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/survey/${surveyId}`)
      .then((res) => {
        const data = res.data.data;
        setSurvey(data);
        setEditableTitle(data.name);
        setLang(data.supportedLanguages[0]);
      });
  }, [surveyId]);

  if (!survey) return <p className="p-6">Loading survey...</p>;

  function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  return (
    <div className="p-6 bg-white">
      <div className="grid grid-cols-12 gap-6">

        {/* ================= LEFT SECTION ================= */}
        <div className="col-span-8 flex flex-col gap-6">

          {/* -------- Survey Details -------- */}
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <input
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="text-2xl font-semibold w-[55%] border-b pb-1 focus:outline-none focus:border-black"
              />

              <div className="flex justify-center items-baseline gap-[0.5rem]">
                <Link to={`${import.meta.env.VITE_FRONTEND_BASE_URL}/survey/${survey.surveyId}`} className="text-sm text-blue-400 w-[10rem] border px-3 py-2 rounded-lg text-sm text-center hover:text-white hover:bg-blue-400">Open Public Survey</Link>

              <select
                className="border px-3 py-2 rounded-lg text-sm"
                value={survey.status}
                disabled
              >
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="complete">Complete</option>
              </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-medium text-gray-800">Survey ID</p>
                <p className="text-gray-600 break-all">
                  {survey.surveyId}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-800">Created By</p>
                <p className="text-gray-600">{survey.createdBy}</p>
              </div>

              <div>
                <p className="font-medium text-gray-800">Status</p>
                <p className="text-gray-600 capitalize">
                  {survey.status}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-800">Categories</p>
                <p className="text-gray-600">
                  {survey.categories.join(", ")}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-800">Languages</p>
                <p className="text-gray-600">
                  {survey.supportedLanguages.join(", ")}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-800">Created At</p>
                <p className="text-gray-600">
                  {formatDate(survey.createdAt)}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-800">Updated At</p>
                <p className="text-gray-600">
                  {formatDate(survey.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* -------- Question Bank (NORMAL FLOW) -------- */}
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Question Bank</h2>

              <select
                className="border px-3 py-2 rounded-lg text-sm"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                {survey.supportedLanguages.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {survey.questions.map((q, index) => (
                <div
                  key={q.qid}
                  className="border rounded-xl p-4 hover:bg-gray-50 transition"
                >
                  <p className="font-medium mb-2">
                    {index + 1}.{" "}
                    {q.text?.get ? q.text.get(lang) : q.text?.[lang]}
                  </p>

                  {Array.isArray(q.options) && (
                    <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                      {q.options.map((o) => (
                        <li key={o.id}>
                          {o.label?.get
                            ? o.label.get(lang)
                            : o.label?.[lang]}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT SECTION ================= */}
        <div className="col-span-4 flex flex-col gap-6">

          {/* -------- Publish Via -------- */}
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-5 text-gray-800">
              Publish via
            </h3>

            <div className="space-y-4 text-sm">
              <button className="flex items-center gap-3 w-full p-3 border rounded-xl hover:bg-blue-50 transition">
                <FaTelegramPlane className="text-blue-500 text-lg" />
                Telegram
              </button>

              <button className="flex items-center gap-3 w-full p-3 border rounded-xl hover:bg-green-50 transition">
                <FaWhatsapp className="text-green-500 text-lg" />
                WhatsApp
              </button>

              <button className="flex items-center gap-3 w-full p-3 border rounded-xl hover:bg-pink-50 transition">
                <FaInstagram className="text-pink-500 text-lg" />
                Instagram
              </button>

              <button className="flex items-center gap-3 w-full p-3 border rounded-xl hover:bg-gray-100 transition">
                <FaXTwitter className="text-black text-lg" />
                X (Twitter)
              </button>
            </div>

            <button className="mt-6 w-full bg-black text-white py-2 rounded-xl text-sm hover:opacity-90">
              Start Publish
            </button>
          </div>

          {/* -------- Custom Dataset -------- */}
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-800">
              Custom Dataset
            </h3>

            <div className="border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center text-sm text-gray-500 gap-3 hover:border-black transition cursor-pointer">
              <FaCloudUploadAlt className="text-3xl" />
              Drag & Drop dataset here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
