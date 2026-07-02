import React, { useState } from 'react';
import { Mail, ShieldAlert, CheckCircle2, AlertTriangle, Play, Sparkles, RefreshCw, Layers } from 'lucide-react';
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
      title: '🧪 Preset 1: Nanotechnology Paper (High Confidence)',
      sender: 'prof.curie@college.edu',
      subject: 'Publication: Novel Graphene Oxide Nanosheets for Targeted Drug Delivery',
      body: "Abstract: We report the synthesis of functionalized graphene oxide nanosheets conjugated with biocompatible polymers for targeted oncology drug delivery. Our in-vitro assay demonstrates 98% encapsulation efficiency and pH-triggered controlled release, minimizing cytotoxicity in healthy tissue cultures.\n\nKeywords: Nanotechnology, Biomaterials, Drug Delivery, Oncology\nAuthors: Dr. Marie Curie, Prof. Robert Langdon",
      dept: 'Chemistry'
    },
    {
      title: '🤖 Preset 2: AI & LLM Paper (High Confidence)',
      sender: 'dr.vance@college.edu',
      subject: 'Research Submission: Reinforcement Learning in Multi-Agent Transformer Architectures',
      body: "Abstract: We propose an asynchronous reinforcement learning algorithm for coordinating multi-agent transformer networks in complex simulation environments. Experimental benchmarks reveal a 40% gain in task completion speed and zero communication bottlenecks compared to decentralized baselines.\n\nKeywords: Artificial Intelligence, Deep Learning, Reinforcement Learning, Multi-Agent\nAuthors: Dr. Eleanor Vance, Dr. Aravind Patel",
      dept: 'Computer Science'
    },
    {
      title: '🚫 Preset 3: Routine Meeting Spam (Rejected by ML Classifier)',
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
    <div className="space-y-8 pb-12">
      
      {/* Banner */}
      <div className="watt-card relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-l from-brand-cyan/5 via-brand-green/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-semibold mb-3">
            <Mail className="w-3.5 h-3.5" />
            <span>Intelligent Email Monitoring & Parsing Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Live ML Ingestion & Classification Demo
          </h1>
          <p className="text-sm text-brand-gray mt-2 leading-relaxed">
            Professors receive hundreds of daily emails. Our system integrates with incoming mailboxes, running every message through a **Scikit-Learn TF-IDF + Naive Bayes Classifier** to distinguish research publications from routine administrative spam, before executing NLP metadata extraction!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Simulation Form Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="watt-card space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Play className="w-4 h-4 text-brand-cyan fill-brand-cyan" />
                <span>Simulate Incoming Email Arrival</span>
              </h2>
              <p className="text-xs text-brand-gray mt-0.5">
                Pick a preset or type custom text to test our scikit-learn relevance classifier in real-time.
              </p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className="p-2.5 rounded-xl bg-brand-bg hover:bg-brand-hover border border-brand-border text-left transition-all group cursor-pointer"
                >
                  <span className="text-[11px] font-semibold text-white group-hover:text-brand-cyan block truncate">
                    {p.title}
                  </span>
                  <span className="text-[10px] text-brand-gray block truncate mt-0.5">{p.dept}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSimulate} className="space-y-4 pt-2 border-t border-brand-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-gray mb-1">Sender Email</label>
                  <input
                    type="email"
                    required
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-gray mb-1">Department Hint</label>
                  <select
                    value={deptHint}
                    onChange={(e) => setDeptHint(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan"
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
                <label className="block text-xs font-medium text-brand-gray mb-1">Email Subject Line</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-gray mb-1">Email Body Content / Abstract Text</label>
                <textarea
                  rows={5}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/80 text-brand-bg font-bold text-xs shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 text-brand-bg ${processing ? 'animate-spin' : ''}`} />
                <span>{processing ? 'Running Scikit-Learn ML Classifier & NLP Extraction...' : 'Execute ML Email Ingestion Pipeline'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Live Classification Result Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="watt-card min-h-[380px] flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-brand-cyan" />
                <span>Real-Time ML Classification Decision</span>
              </h3>

              {!lastResult ? (
                <div className="text-center py-16 px-4 bg-brand-bg rounded-2xl border border-dashed border-brand-border">
                  <Mail className="w-10 h-10 text-brand-gray mx-auto mb-3 animate-bounce" />
                  <p className="text-xs font-semibold text-white">Waiting for email ingestion event</p>
                  <p className="text-[11px] text-brand-gray mt-1">
                    Click the execute button to test the scikit-learn relevance classifier!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Status Banner - WattVision Alerts Style */}
                  {lastResult.status === 'processed' ? (
                    <div className="bg-brand-green/10 text-brand-green border-l-4 border-brand-green p-4 rounded-r-lg shadow-lg flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider">Indexed into Repository</h4>
                        <p className="text-xs mt-1 leading-relaxed text-white">
                          Classified as an authentic research publication. NLP metadata extracted and saved to DB.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="watt-alert shadow-lg flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider">Filtered Out by ML Model</h4>
                        <p className="text-xs mt-1 leading-relaxed text-white">
                          {lastResult.error_message || 'Classified as routine general chatter/spam.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Score Breakdown Card */}
                  <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-brand-gray font-medium">Predicted ML Class:</span>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        lastResult.ml_predicted_class === 'research_paper' ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-brand-border text-brand-gray'
                      }`}>
                        {lastResult.ml_predicted_class}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-brand-gray font-medium">Scikit-Learn Confidence Score:</span>
                      <span className="text-brand-green font-mono font-bold text-base">
                        {(lastResult.ml_classification_score * 100).toFixed(1)}%
                      </span>
                    </div>

                    {lastResult.extracted_paper_id && (
                      <div className="pt-2 border-t border-brand-border flex items-center justify-between">
                        <span className="text-brand-gray font-medium">Extracted Paper ID:</span>
                        <span className="text-brand-cyan font-mono font-bold">#CRD-{lastResult.extracted_paper_id}</span>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            <div className="pt-4 border-t border-brand-border text-[11px] text-brand-gray text-center font-mono">
              Model: TF-IDF n-gram (1,2) + Multinomial Naive Bayes / Random Forest
            </div>
          </div>
        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="watt-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-cyan" />
              <span>Email Ingestion Audit Log</span>
            </h3>
            <p className="text-xs text-brand-gray mt-0.5">
              Historical log of monitored emails and automated classification decisions
            </p>
          </div>
          <button
            onClick={onRefreshLogs}
            className="p-2 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border transition-colors cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-brand-border text-brand-gray uppercase font-semibold text-[10px]">
                <th className="py-3 px-3">Sender</th>
                <th className="py-3 px-3">Subject Line</th>
                <th className="py-3 px-3">ML Prediction</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Received At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-gray italic">No emails ingested yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-hover transition-colors">
                    <td className="py-3 px-3 font-medium truncate max-w-[140px]">{log.sender}</td>
                    <td className="py-3 px-3 truncate max-w-[220px] text-brand-gray">{log.subject}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.ml_predicted_class === 'research_paper' ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-brand-border text-brand-gray'
                      }`}>
                        {log.ml_predicted_class === 'research_paper' ? 'Research' : 'General/Spam'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-brand-green">{(log.ml_classification_score * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.status === 'processed' ? 'bg-brand-green/20 text-brand-green border border-brand-green/30' :
                        log.status === 'rejected_spam' ? 'bg-brand-red/20 text-brand-red border border-brand-red/30' :
                        'bg-brand-red/10 text-brand-red'
                      }`}>
                        {log.status === 'processed' ? 'Indexed' : log.status === 'rejected_spam' ? 'Rejected' : 'Error'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-brand-gray text-[11px]">
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
