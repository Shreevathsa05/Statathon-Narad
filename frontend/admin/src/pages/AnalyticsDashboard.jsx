import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import { surveyClient } from '../api/survey.js';
import client from '../api/client.js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Users, Clock, AlertTriangle, ArrowLeft, Loader2, Info } from 'lucide-react';

const COLORS = ['#000000', '#525252', '#A3A3A3', '#D4D4D4', '#E5E5E5'];
const PIE_COLORS = ['#0070F3', '#50E3C2', '#F5A623', '#E60000', '#8B5CF6'];

export default function AnalyticsDashboard() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1. Fetch schema
        const surveyRes = await surveyClient.getSurveyById(surveyId);
        const fetchedSurvey = surveyRes.data?.data;
        if (!fetchedSurvey) throw new Error("Survey not found");
        
        // 2. Fetch responses
        const responseRes = await client.get(`/response/${surveyId}`);
        const fetchedResponses = responseRes.data?.data || [];
        
        setSurvey(fetchedSurvey);
        setResponses(fetchedResponses);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [surveyId]);

  // Derived Metrics
  const metrics = useMemo(() => {
    if (!responses.length) return { total: 0, avgDuration: 'N/A', flagged: 0, modes: [], states: [] };
    
    let totalTime = 0;
    let validTimes = 0;
    let flagged = 0;
    const modeCount = {};
    const stateCount = {};

    responses.forEach(r => {
      // Flags
      if (r.isFlagged) flagged++;

      // Duration
      if (r.paraInfo?.interviewInfo?.interviewStartTime && r.paraInfo?.interviewInfo?.interviewEndTime) {
        const start = new Date(r.paraInfo.interviewInfo.interviewStartTime).getTime();
        const end = new Date(r.paraInfo.interviewInfo.interviewEndTime).getTime();
        const diff = (end - start) / 1000;
        if (diff > 0 && diff < 36000) {
          totalTime += diff;
          validTimes++;
        }
      }

      // Mode
      const mode = r.paraInfo?.interviewInfo?.interviewMode || 'Unknown';
      modeCount[mode] = (modeCount[mode] || 0) + 1;

      // State
      const state = r.paraInfo?.locationInfo?.state || 'Unknown';
      stateCount[state] = (stateCount[state] || 0) + 1;
    });

    const avgSeconds = validTimes > 0 ? Math.round(totalTime / validTimes) : 0;
    const avgDuration = avgSeconds > 60 ? `${Math.floor(avgSeconds/60)}m ${avgSeconds%60}s` : `${avgSeconds}s`;

    const modes = Object.keys(modeCount).map(k => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: modeCount[k] }));
    const states = Object.keys(stateCount).map(k => ({ name: k, value: stateCount[k] })).sort((a, b) => b.value - a.value).slice(0, 5);

    return { total: responses.length, avgDuration, flagged, modes, states };
  }, [responses]);

  // Question Aggregations
  const questionData = useMemo(() => {
    if (!survey || !responses.length) return [];
    
    const results = [];
    survey.questionSections?.forEach(section => {
      section.questions?.forEach(q => {
        if (q.type !== 'mcq' && q.type !== 'checkbox') return;
        
        // Find English text or first available text
        const qText = q.text?.english || Object.values(q.text || {})[0] || q.qid;
        
        // Build option label map
        const optMap = {};
        q.options?.forEach(opt => {
          optMap[opt.id] = opt.label?.english || Object.values(opt.label || {})[0] || opt.id;
        });

        // Tally answers
        const tallies = {};
        q.options?.forEach(opt => tallies[opt.id] = 0); // initialize all to 0

        responses.forEach(r => {
          const ansObj = r.response?.find(ans => ans.qid === q.qid);
          if (ansObj && ansObj.answer) {
            if (Array.isArray(ansObj.answer)) {
              ansObj.answer.forEach(optId => {
                if (tallies[optId] !== undefined) tallies[optId]++;
              });
            } else {
              if (tallies[ansObj.answer] !== undefined) tallies[ansObj.answer]++;
            }
          }
        });

        const data = Object.keys(tallies).map(optId => ({
          name: optMap[optId] || optId,
          value: tallies[optId]
        }));

        results.push({ qid: q.qid, text: qText, type: q.type, data });
      });
    });
    return results;
  }, [survey, responses]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-w-0 bg-bg">
        <TopBar title="Analytics Dashboard" />
        <div className="flex flex-col flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-text-muted mb-4" size={32} />
          <p className="text-sm text-text-muted">Crunching survey data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 min-w-0 bg-bg">
        <TopBar title="Analytics Dashboard" />
        <div className="p-8 flex flex-col items-center justify-center h-full">
          <AlertTriangle className="text-geist-error mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">Error loading analytics</h2>
          <p className="text-text-muted mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-black text-white rounded-md font-medium text-sm hover:bg-neutral-800 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg pb-12">
      <TopBar title="Analytics Dashboard" />
      
      <div className="w-full max-w-[1200px] mx-auto p-6 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-surface transition-colors text-text-muted hover:text-text-primary"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">
              {survey?.name || "Survey Analytics"}
            </h1>
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <span className="font-mono text-[11px] px-2 py-0.5 bg-surface-alt border border-border rounded">
                #{surveyId.substring(0, 8)}
              </span>
              <span>{metrics.total} responses collected</span>
            </div>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-md bg-surface opacity-0 animate-fade-in-card">
            <Info size={40} className="text-border mb-4" />
            <h3 className="text-lg font-medium text-text-primary">No Data Available</h3>
            <p className="text-sm text-text-muted mt-1 max-w-md">This survey has not received any responses yet. Analytics will populate here once responses are collected.</p>
          </div>
        ) : (
          <div className="opacity-0 animate-fade-in-card flex flex-col gap-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface border border-border p-5 rounded-md flex flex-col shadow-sm">
                <div className="flex items-center gap-2 text-text-muted text-sm font-medium mb-3 uppercase tracking-wider text-[11px]">
                  <Users size={14} /> Total Responses
                </div>
                <div className="text-3xl font-bold tracking-tight text-text-primary">
                  {metrics.total}
                </div>
              </div>
              <div className="bg-surface border border-border p-5 rounded-md flex flex-col shadow-sm">
                <div className="flex items-center gap-2 text-text-muted text-sm font-medium mb-3 uppercase tracking-wider text-[11px]">
                  <Clock size={14} /> Avg. Duration
                </div>
                <div className="text-3xl font-bold tracking-tight text-text-primary">
                  {metrics.avgDuration}
                </div>
              </div>
              <div className="bg-surface border border-border p-5 rounded-md flex flex-col shadow-sm">
                <div className="flex items-center gap-2 text-text-muted text-sm font-medium mb-3 uppercase tracking-wider text-[11px]">
                  <AlertTriangle size={14} /> Quality Flags
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold tracking-tight text-geist-error">
                    {metrics.flagged}
                  </div>
                  <div className="text-sm text-text-muted font-medium">
                    ({Math.round((metrics.flagged / metrics.total) * 100)}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Demographics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interview Modes */}
              <div className="bg-bg border border-border p-6 rounded-md shadow-sm">
                <h3 className="text-sm font-semibold text-text-primary tracking-tight mb-6">Collection Channels</h3>
                <div className="h-[240px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                    <PieChart>
                      <Pie
                        data={metrics.modes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {metrics.modes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#000', borderColor: '#2E2E2E', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                        itemStyle={{ color: '#EDEDED' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* State Distribution */}
              <div className="bg-bg border border-border p-6 rounded-md shadow-sm">
                <h3 className="text-sm font-semibold text-text-primary tracking-tight mb-6">Top Regions (States)</h3>
                <div className="h-[240px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                    <BarChart data={metrics.states} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#000' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        contentStyle={{ backgroundColor: '#000', borderColor: '#2E2E2E', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                      />
                      <Bar dataKey="value" fill="#000000" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Question Breakdown */}
            {questionData.length > 0 && (
              <div className="flex flex-col gap-6 mt-4">
                <h2 className="text-lg font-bold tracking-tight text-text-primary border-b border-border pb-2">
                  Question Breakdown
                </h2>
                
                {questionData.map((q, i) => (
                  <div key={q.qid} className="bg-bg border border-border p-6 rounded-md shadow-sm">
                    <div className="mb-6">
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border bg-surface-alt border-border text-text-muted uppercase tracking-widest mb-2">
                        Q{i+1} • {q.type}
                      </span>
                      <h3 className="text-base font-semibold text-text-primary leading-snug max-w-3xl">
                        {q.text}
                      </h3>
                    </div>
                    
                    <div className="h-[260px] w-full mt-4 min-w-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                        <BarChart data={q.data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#737373' }} 
                            axisLine={false} 
                            tickLine={false}
                            interval={0}
                            tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#737373' }} 
                            axisLine={false} 
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <RechartsTooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                            contentStyle={{ backgroundColor: '#000', borderColor: '#2E2E2E', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="value" fill="#000000" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
