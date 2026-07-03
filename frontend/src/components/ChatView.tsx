import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, AlertTriangle, Tag, FileText, ChevronRight, ChevronDown, HelpCircle, ArrowRight, CornerDownLeft, Trash2 } from 'lucide-react';
import type { ResearchPaper, ChatResponse, User as UserType } from '../types';
import { chatService, SERVER_BASE_URL } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  response?: ChatResponse;
  isError?: boolean;
}

interface ChatViewProps {
  user: UserType | null;
  onSelectPaper: (paper: ResearchPaper) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ user, onSelectPaper }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem('crd_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Failed to parse saved chat messages", e);
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: `Hello ${user?.full_name || 'Professor'}. I am the CRD AI Research Assistant. You can ask me queries about research papers, authors, departments, or publication categories in natural language. How can I help you today?`,
        timestamp: new Date()
      }
    ];
  });
  
  const [input, setInput] = useState(() => {
    return sessionStorage.getItem('crd_chat_input') || '';
  });
  
  const [loading, setLoading] = useState(false);
  const [expandedPaperId, setExpandedPaperId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist messages to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('crd_chat_messages', JSON.stringify(messages));
  }, [messages]);

  // Persist draft input to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('crd_chat_input', input);
  }, [input]);

  const handleClearChat = () => {
    if (!window.confirm("Are you sure you want to clear your chat history?")) return;
    const initialWelcome: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      text: `Hello ${user?.full_name || 'Professor'}. I am the CRD AI Research Assistant. You can ask me queries about research papers, authors, departments, or publication categories in natural language. How can I help you today?`,
      timestamp: new Date()
    };
    setMessages([initialWelcome]);
    setInput('');
    sessionStorage.removeItem('crd_chat_messages');
    sessionStorage.removeItem('crd_chat_input');
    setExpandedPaperId(null);
  };

  const suggestions = [
    "What research has Dr. Eleanor Vance published?",
    "List all Computer Science publications from 2026.",
    "Show papers related to CRISPR genome editing.",
    "Are there any publications on electric vehicle battery thermal management?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatService.query(textToSend);
      
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: response.is_academic_query ? response.response_text : (response.rejection_reason || "Query rejected by guardrails."),
        timestamp: new Date(),
        response: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: err.response?.data?.detail || "An error occurred while connecting to the AI Assistant. Please ensure your backend is online and the Gemini API key is configured.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-20 h-[580px]">
      
      {/* Left Column: Guardrail Policy & Quick Suggestions */}
      <div className="lg:col-span-1 flex flex-col justify-between space-y-4 h-full">
        
        {/* Guardrail Policy Info Box */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
          <div className="flex items-center space-x-2 text-brand-red font-semibold text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>Assistant Guardrails</span>
          </div>
          
          <p className="text-xs text-brand-gray leading-relaxed mb-4">
            This chat interface is explicitly designed to query the College Research Digest database. It operates under strict academic parameters:
          </p>

          <div className="space-y-3 text-[11px] text-brand-gray flex-1">
            <div className="p-3.5 rounded-xl bg-brand-bg/50 border border-brand-border/60">
              <strong className="text-white block mb-0.5">✅ Supported Topics</strong>
              Searching for faculty papers, looking up specific authors, summarizing papers, and filtering by department/year.
            </div>
            <div className="p-3.5 rounded-xl bg-brand-red/5 border border-brand-red/15 text-brand-red/90">
              <strong className="text-brand-red block mb-0.5">❌ Restricted Topics</strong>
              General chat, coding help, email administrative tasks, exam structures, and non-academic knowledge. Unrelated questions will trigger immediate rejection.
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-brand-border text-[10px] text-brand-gray/80 text-center font-sans">
            AI Engine: Gemini 3.5 Flash
          </div>
        </div>

        {/* Suggestions Box */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center">
            <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-brand-cyan" /> Suggested Queries
          </h3>
          <div className="space-y-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s)}
                className="w-full text-left p-2.5 rounded-xl bg-brand-bg hover:bg-brand-hover border border-brand-border text-[11px] text-brand-gray hover:text-brand-cyan transition-all flex items-start space-x-1.5 cursor-pointer group"
              >
                <ArrowRight className="w-3 h-3 text-brand-gray group-hover:text-brand-cyan shrink-0 mt-0.5" />
                <span className="leading-snug">{s}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column: Main Chat Window */}
      <div className="lg:col-span-3 flex flex-col bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden h-full">
        
        {/* Chat Window Header */}
        <div className="px-6 py-4 bg-brand-card border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 flex items-center justify-center border border-brand-cyan/35 shadow-sm shadow-brand-cyan/10">
              <MessageSquare className="w-4 h-4 text-brand-cyan" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">AI Research Assistant</h2>
              <p className="text-[10px] text-brand-cyan font-medium uppercase tracking-wider flex items-center mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping mr-1.5 inline-block" />
                Natural Language Query Engine
              </p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 rounded-lg bg-brand-red/10 text-brand-red hover:bg-brand-red/20 border border-brand-red/25 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>

        {/* Chat Logs scrollable container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-brand-bg/20">
          
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md ${
                  isUser 
                    ? 'bg-gradient-to-br from-brand-cyan/20 to-brand-cyan/5 text-white border border-brand-cyan/30 rounded-tr-none' 
                    : msg.isError 
                      ? 'bg-brand-red/10 border border-brand-red/25 text-white rounded-tl-none' 
                      : msg.response && !msg.response.is_academic_query 
                        ? 'bg-brand-red/5 border border-brand-red/20 text-white rounded-tl-none'
                        : 'bg-brand-card border border-brand-border text-white rounded-tl-none'
                }`}>
                  
                  {/* Message Sender Info */}
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-brand-gray">
                    <span className="font-semibold flex items-center">
                      {!isUser && <Sparkles className="w-3 h-3 mr-1 text-brand-cyan fill-brand-cyan/20" />}
                      {isUser ? 'You' : 'CRD Research Agent'}
                    </span>
                    <span>{formatTime(msg.timestamp)}</span>
                  </div>

                  {/* Main Message Text */}
                  <div className="text-xs leading-relaxed whitespace-pre-line font-sans">
                    {msg.text}
                  </div>

                  {/* Structured Search filters block */}
                  {msg.response && msg.response.is_academic_query && msg.response.filters && (
                    <div className="mt-3.5 pt-3 border-t border-brand-border/60">
                      <div className="text-[10px] font-bold text-brand-gray uppercase tracking-wider mb-2 flex items-center">
                        <Tag className="w-3.5 h-3.5 mr-1 text-brand-cyan" /> Detected Query Parameters:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.response.filters.departments.map((dept, i) => (
                          <span key={`dept-${i}`} className="px-2 py-0.5 rounded bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan text-[9px] font-semibold font-mono">
                            Dept: {dept}
                          </span>
                        ))}
                        {msg.response.filters.authors.map((auth, i) => (
                          <span key={`auth-${i}`} className="px-2 py-0.5 rounded bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan text-[9px] font-semibold font-mono">
                            Author: {auth}
                          </span>
                        ))}
                        {msg.response.filters.years.map((year, i) => (
                          <span key={`year-${i}`} className="px-2 py-0.5 rounded bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan text-[9px] font-semibold font-mono">
                            Year: {year}
                          </span>
                        ))}
                        {msg.response.filters.categories.map((cat, i) => (
                          <span key={`cat-${i}`} className="px-2 py-0.5 rounded bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan text-[9px] font-semibold font-mono">
                            Category: {cat}
                          </span>
                        ))}
                        {msg.response.filters.title_keywords.map((kw, i) => (
                          <span key={`kw-${i}`} className="px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[9px] font-semibold font-mono">
                            Keyword: {kw}
                          </span>
                        ))}
                        {msg.response.filters.general_query && (
                          <span className="px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[9px] font-semibold font-mono">
                            Search: {msg.response.filters.general_query}
                          </span>
                        )}
                        {!msg.response.filters.departments.length && 
                         !msg.response.filters.authors.length && 
                         !msg.response.filters.years.length && 
                         !msg.response.filters.categories.length && 
                         !msg.response.filters.title_keywords.length && 
                         !msg.response.filters.general_query && (
                          <span className="px-2 py-0.5 rounded bg-brand-border text-brand-gray text-[9px] font-mono">
                            Broad Search
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Guardrail warnings box */}
                  {msg.response && !msg.response.is_academic_query && (
                    <div className="mt-3 p-2.5 rounded-xl bg-brand-red/10 border border-brand-red/25 flex items-start space-x-2 text-[10px] text-brand-red">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <div>
                        <strong>Guardrail Violation</strong>
                        <p className="mt-0.5 text-[9px] text-brand-red/90 leading-normal">
                          This query falls outside research papers, authors, departments, or categories. Please try phrasing a query related directly to college publications.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Structured Search Results List */}
                  {msg.response && msg.response.is_academic_query && msg.response.papers && msg.response.papers.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-brand-border/60 space-y-2">
                      <div className="text-[10px] font-bold text-brand-gray uppercase tracking-wider mb-2 flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1 text-brand-cyan" /> Structured Database Matches ({msg.response.papers.length}):
                      </div>
                      <div className="space-y-2">
                        {msg.response.papers.map((paper) => {
                          const isExpanded = expandedPaperId === paper.id;
                          return (
                            <div 
                              key={paper.id}
                              className="border border-brand-border rounded-xl overflow-hidden bg-brand-bg/40 hover:bg-brand-bg/60 transition-all"
                            >
                              {/* Accordion Header */}
                              <button
                                onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                                className="w-full p-3 text-left flex items-center justify-between hover:text-brand-cyan transition-colors cursor-pointer group"
                              >
                                <div className="max-w-[88%] space-y-1">
                                  <span className="text-[11px] font-bold text-white block group-hover:text-brand-cyan line-clamp-1 leading-normal transition-colors">
                                    {paper.title}
                                  </span>
                                  <div className="flex items-center space-x-2 text-[9px] text-brand-gray">
                                    <span className="font-medium text-white/80">{paper.authors_raw || paper.authors_list.join(", ")}</span>
                                    <span>•</span>
                                    <span>{paper.department}</span>
                                    <span>•</span>
                                    <span className="font-mono">{paper.publication_year}</span>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-brand-cyan transform rotate-180 transition-all shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-brand-gray group-hover:text-brand-cyan transition-all shrink-0" />
                                )}
                              </button>
                              
                              {/* Accordion Body */}
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-brand-border/40 space-y-3 bg-brand-card/30 text-xs">
                                  {/* AI Summary Card */}
                                  <div className="p-3 rounded-xl bg-brand-bg/60 border-l-3 border-brand-cyan text-[11px] leading-relaxed italic text-white/95 font-sans">
                                    <span className="text-brand-cyan font-bold block not-italic text-[10px] uppercase tracking-wider mb-1 flex items-center">
                                      <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Summary
                                    </span>
                                    “{paper.ai_summary || paper.abstract}”
                                  </div>
                                  
                                  {/* Key Metadata Table */}
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="p-2 rounded bg-brand-bg/40 border border-brand-border/60">
                                      <span className="text-brand-gray block text-[8px] uppercase font-bold">Journal / Conference</span>
                                      <span className="text-white truncate block">{paper.journal_or_conference || 'N/A'}</span>
                                    </div>
                                    <div className="p-2 rounded bg-brand-bg/40 border border-brand-border/60">
                                      <span className="text-brand-gray block text-[8px] uppercase font-bold">DOI</span>
                                      <span className="text-white font-mono truncate block">{paper.doi || 'N/A'}</span>
                                    </div>
                                    <div className="p-2 rounded bg-brand-bg/40 border border-brand-border/60">
                                      <span className="text-brand-gray block text-[8px] uppercase font-bold">Citations</span>
                                      <span className="text-brand-green font-mono font-bold block">{paper.citation_count} citations</span>
                                    </div>
                                    <div className="p-2 rounded bg-brand-bg/40 border border-brand-border/60">
                                      <span className="text-brand-gray block text-[8px] uppercase font-bold">ML Confidence</span>
                                      <span className="text-brand-cyan font-mono font-bold block">{(paper.ml_confidence * 100).toFixed(1)}%</span>
                                    </div>
                                  </div>
                                  
                                  {/* Abstract */}
                                  <div>
                                    <span className="text-[9px] font-bold text-brand-gray uppercase tracking-wider block mb-1">Full Abstract:</span>
                                    <p className="text-[10px] text-brand-gray leading-normal bg-brand-bg/30 p-2.5 rounded border border-brand-border/50 max-h-24 overflow-y-auto custom-scrollbar font-sans">
                                      {paper.abstract || 'No abstract text available.'}
                                    </p>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-brand-border/20">
                                    <button
                                      onClick={() => onSelectPaper(paper)}
                                      className="px-2.5 py-1 rounded bg-brand-bg hover:bg-brand-hover text-white border border-brand-border text-[9px] font-semibold transition-all cursor-pointer"
                                    >
                                      View Full Metadata
                                    </button>
                                    {paper.pdf_url && (
                                      <a
                                        href={`${SERVER_BASE_URL}${paper.pdf_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2.5 py-1.5 rounded bg-brand-cyan/20 hover:bg-brand-cyan/35 border border-brand-cyan/30 text-brand-cyan text-[9px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                                      >
                                        <span>View PDF</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty state matches */}
                  {msg.response && msg.response.is_academic_query && msg.response.papers && msg.response.papers.length === 0 && (
                    <div className="mt-3.5 p-3 rounded-xl bg-brand-bg border border-brand-border text-center text-[10px] text-brand-gray">
                      No research publications match these search parameters.
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {/* Loading bubble */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-brand-card border border-brand-border rounded-2xl rounded-tl-none p-4 max-w-[60%] flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-brand-gray font-semibold">Agent is querying database...</span>
              </div>
            </div>
          )}

        </div>

        {/* Input box section */}
        <div className="p-4 bg-brand-card border-t border-brand-border">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }} 
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about publications, authors, or departments... (e.g. 'What did Robert Langdon publish in 2026?')"
              className="flex-1 bg-brand-bg border border-brand-border text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-brand-cyan/60 transition-all font-sans placeholder:text-brand-gray/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4.5 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/80 hover:brightness-115 text-brand-bg font-bold text-xs transition-all disabled:opacity-40 flex items-center space-x-1.5 shadow-lg shadow-brand-cyan/10 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          
          <div className="mt-2.5 px-1.5 flex items-center justify-between text-[9px] text-brand-gray/60 font-sans">
            <span className="flex items-center">
              <CornerDownLeft className="w-3 h-3 mr-1" /> Press Enter to query
            </span>
            <span>Queries are parsed locally before DB search</span>
          </div>
        </div>

      </div>

    </div>
  );
};
