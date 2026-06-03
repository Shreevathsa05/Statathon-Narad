import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyClient } from '../../api/survey';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';

export default function ManualBuilder() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const surveyId = window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      
      const payload = {
        surveyId,
        name,
        status: 'pending',
        supportedLanguages: ['english'],
        categories: category ? [category] : ['General'],
        questionSections: [
          {
            sectionName: "User Demographics",
            questions: [
              {
                  qid: "fullname",
                  type: "text",
                  text: { english: "Full Name" },
                  audio: { english: "" }
              },
              {
                  qid: "age",
                  type: "text",
                  text: { english: "Age" },
                  audio: { english: "" }
              },
              {
                  qid: "gender",
                  type: "mcq",
                  text: { english: "Gender" },
                  audio: { english: "" },
                  options: [
                      { id: "male", label: { english: "Male" } },
                      { id: "female", label: { english: "Female" } },
                      { id: "other", label: { english: "Other" } }
                  ]
              },
              {
                  qid: "primarylanguage",
                  type: "text",
                  text: { english: "Primary Language" },
                  audio: { english: "" }
              },
              {
                  qid: "uid-type",
                  type: "mcq",
                  text: { english: "UID Type" },
                  audio: { english: "" },
                  options: [
                      { id: "aadhaar", label: { english: "Aadhaar" } },
                      { id: "phone_no", label: { english: "Phone no." } },
                  ]
              },
              {
                  qid: "uid",
                  type: "text",
                  text: { english: "UID" },
                  audio: { english: "" }
              },
              {
                  qid: "pincode",
                  type: "text",
                  text: { english: "Pincode" },
                  audio: { english: "" }
              },
              {
                  qid: "area",
                  type: "text",
                  text: { english: "Area" },
                  audio: { english: "" }
              }
            ]
          }
        ],
        createdBy: "SDRD_Admin"
      };

      await surveyClient.createSurvey(payload);
      navigate(`/sdrd/editor/${surveyId}`);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create survey framework');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg">
      {/* Full-width container for the back button */}
      <div className="w-full px-8 pt-6 pb-2">
        <button 
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary mb-6 transition-colors self-start"
          onClick={() => navigate('/sdrd')}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="flex flex-col flex-1 px-6 pb-16 mx-auto w-full max-w-[1200px]">
        <div className="max-w-[65ch] mx-auto w-full">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-8">
          Manual Survey Builder
        </h1>

        {error && (
          <div className="flex items-start px-4 py-3 rounded-md text-sm border border-geist-error/20 bg-geist-error/10 text-geist-error mb-4">
            <AlertCircle size={16} className="shrink-0 mr-2 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-semibold">Error</span>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">Survey Name</label>
            <input 
              className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-geist-blue transition-colors"
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. National Household Survey 2026"
              required
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">
              Category <span className="text-text-muted font-normal">(Optional)</span>
            </label>
            <input 
              className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-geist-blue transition-colors"
              type="text" 
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Economy, Health, Demographics"
            />
          </div>

          {/* Submit */}
          <div className="pt-6 mt-2 border-t border-border">
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 h-11 text-base font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating framework...' : 'Create Empty Survey'}
            </button>
          </div>

        </form>
      </div>
      </div>
    </div>
  );
}
