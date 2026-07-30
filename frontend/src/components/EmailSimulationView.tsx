import React, { useState } from 'react';
import { Mail, ShieldAlert, CheckCircle2, AlertTriangle, Send, Sparkles, RefreshCw, Layers } from 'lucide-react';
import type { EmailLog } from '../types';
import { emailService } from '../services/api';

interface EmailSimulationViewProps {
  logs: EmailLog[];
  onRefreshLogs: () => void;
  onPaperIngested: () => void;
}

export const EmailSimulationView: React.FC<EmailSimulationViewProps> = ({
  logs,
  onRefreshLogs,
  onPaperIngested,
}) => {
  const [sender, setSender] = useState('prof.curie@college.edu');
  const [subject, setSubject] = useState('Publication Submission: Novel Graphene Oxide Nanosheets for Drug Delivery');
  const [body, setBody] = useState(
    "Abstract: We report the synthesis of functionalized graphene oxide nanosheets conjugated with biocompatible polymers for targeted oncology drug delivery. Our in-vitro assay demonstrates 98% encapsulation efficiency and pH-triggered controlled release, minimizing cytotoxicity in healthy tissue cultures.\n\nKeywords: Nanotechnology, Biomaterials, Drug Delivery, Oncology\nAuthors: Dr. Marie Curie, Prof. Robert Langdon"
  );
  const [deptHint, setDeptHint] = useState('Chemistry');
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<EmailLog | null>(null);

  const presets = [
    {
      title: 'Preset 1: Nanotechnology Paper (High Confidence)',
      sender: 'prof.curie@college.edu',
      subject: 'Publication: Novel Graphene Oxide Nanosheets for Targeted Drug Delivery',
      body: "Abstract: We report the synthesis of functionalized graphene oxide nanosheets conjugated with biocompatible polymers for targeted oncology drug delivery. Our in-vitro assay demonstrates 98% encapsulation efficiency and pH-triggered controlled release, minimizing cytotoxicity in healthy tissue cultures.\n\nKeywords: Nanotechnology, Biomaterials, Drug Delivery, Oncology\nAuthors: Dr. Marie Curie, Prof. Robert Langdon",
      dept: 'Chemistry'
    },
    {
      title: 'Preset 2: AI & LLM Paper (High Confidence)',
      sender: 'dr.vance@college.edu',
      subject: 'Research Submission: Reinforcement Learning in Multi-Agent Transformer Architectures',
      body: "Abstract: We propose an asynchronous reinforcement learning algorithm for coordinating multi-agent transformer networks in complex simulation environments. Experimental benchmarks reveal a 40% gain in task completion speed and zero communication bottlenecks compared to decentralized baselines.\n\nKeywords: Artificial Intelligence, Deep Learning, Reinforcement Learning, Multi-Agent\nAuthors: Dr. Eleanor Vance, Dr. Aravind Patel",
      dept: 'Computer Science'
    },
    {
      title: 'Preset 3: Routine Meeting Spam (Rejected by ML Classifier)',
      sender: 'hr.admin@college.edu',
      subject: 'Reminder: Mandatory Faculty Department Meeting Tomorrow at 3 PM',
      body: "Please note that our monthly general faculty assembly is scheduled for tomorrow afternoon in Conference Room B. We will discuss semester grading deadlines, campus Wi-Fi maintenance schedules, and budget allocations for printer stationery supplies. Attendance is required.",
      dept: 'General'
    }
  ];

  const loadPreset = (p: typeof presets[0]) => {
    setSender(p.sender);
    setSubject(p.subject);
    setBody(p.body);
    setDeptHint(p.dept);
    setLastResult(null);
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setLastResult(null);
    try {
      const res = await emailService.simulate(sender, subject, body, deptHint);
      setLastResult(res);
      onRefreshLogs();
      if (res.status === 'processed') {
        onPaperIngested();
      }
    } catch (err) {
      alert("Error executing ML email ingestion simulation.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="watt-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Mail className="w-6 h-6 text-blue-600" />
            <span>Email Ingestion &amp; Classification Sandbox</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulate incoming professor publication emails to test TF-IDF + Multinomial Naive Bayes classification.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-blue-600 font-bold uppercase tracking-wider text-xs border border-blue-200 bg-blue-50 px-2.5 py-1 rounded-md">
            ML PIPELINE ONLINE
          </span>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Email Simulation Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="watt-card space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Compose Inbound Email Payload</span>
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Pick a preset or type custom text to test our scikit-learn relevance classifier in real-time.
              </p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 block truncate">
                    {p.title}
                  </span>
                  <span className="text-xs text-slate-500 block truncate mt-0.5">{p.dept}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSimulate} className="space-y-3.5 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Email</label>
                  <input
                    type="email"
                    required
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Department Hint</label>
                  <select
                    value={deptHint}
                    onChange={(e) => setDeptHint(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Economics & Finance">Economics & Finance</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email Subject Line</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email Body Content / Abstract Text</label>
                <textarea
                  rows={5}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full watt-btn-primary"
              >
                <Sparkles className={`w-4 h-4 text-white ${processing ? 'animate-spin' : ''}`} />
                <span>{processing ? 'Running Scikit-Learn ML Classifier & NLP Extraction...' : 'Execute ML Email Ingestion Pipeline'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Live Classification Result Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="watt-card min-h-[380px] flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Real-Time ML Classification Decision</span>
              </h3>

              {!lastResult ? (
                <div className="text-center py-16 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <Mail className="w-9 h-9 text-slate-400 mx-auto mb-3 animate-bounce" />
                  <p className="text-xs font-semibold text-slate-900">Waiting for email ingestion event</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click the execute button to test the scikit-learn relevance classifier!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Status Banner */}
                  {lastResult.status === 'processed' ? (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3.5 rounded-lg flex items-start space-x-3 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Indexed into Repository</h4>
                        <p className="text-xs mt-0.5 leading-relaxed text-emerald-800">
                          Classified as an authentic research publication. NLP metadata extracted and saved to DB.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 border border-amber-200 p-3.5 rounded-lg flex items-start space-x-3 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">Filtered Out by ML Model</h4>
                        <p className="text-xs mt-0.5 leading-relaxed text-amber-800">
                          {lastResult.error_message || 'Classified as routine general chatter/spam.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Score Breakdown Card */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Predicted Class:</span>
                      <span className="font-mono uppercase font-bold text-[10px] text-slate-700">
                        {lastResult.ml_predicted_class}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Confidence Score:</span>
                      <span className="text-emerald-600 font-mono font-bold text-sm">
                        {(lastResult.ml_classification_score * 100).toFixed(1)}%
                      </span>
                    </div>

                    {lastResult.extracted_paper_id && (
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Extracted Paper ID:</span>
                        <span className="text-blue-600 font-mono font-bold">#PROMPTFLOW-{lastResult.extracted_paper_id}</span>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>


          </div>
        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="watt-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Email Ingestion Audit Log</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical log of monitored emails and automated classification decisions
            </p>
          </div>
          <button
            onClick={onRefreshLogs}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                <th className="py-2.5 px-3">Sender</th>
                <th className="py-2.5 px-3">Subject Line</th>
                <th className="py-2.5 px-3">Prediction</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Received At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">No emails ingested yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-medium truncate max-w-[140px] text-slate-900">{log.sender}</td>
                    <td className="py-2.5 px-3 truncate max-w-[220px] text-slate-600">{log.subject}</td>
                    <td className="py-2.5 px-3">
                      {log.ml_predicted_class === 'research_paper' ? (
                        <span className="font-semibold text-slate-700">Research</span>
                      ) : (
                        <span className="text-slate-500 font-normal">General/Spam</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{(log.ml_classification_score * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3">
                      {log.status === 'processed' ? (
                        <span className="font-semibold text-emerald-600">Indexed</span>
                      ) : (
                        <span className="font-semibold text-amber-600">Rejected</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">
                      {log.received_at ? new Date(log.received_at).toLocaleTimeString() : 'Just now'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
