import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  AlertTriangle, 
  Tag, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  HelpCircle, 
  Trash2, 
  Plus, 
  MessageCircle, 
  History, 
  PanelLeftClose, 
  PanelLeft, 
  Bot, 
  User, 
  BookOpen, 
  Compass, 
  X, 
  Database,
  ArrowUpRight
} from 'lucide-react';
import type { ResearchPaper, ChatResponse, User as UserType } from '../types';
import { chatService } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  response?: ChatResponse;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatViewProps {
  user: UserType | null;
  onSelectPaper: (paper: ResearchPaper) => void;
  onSelectAuthor?: (authorName: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ user, onSelectPaper, onSelectAuthor }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('default-session');

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedPaperId, setExpandedPaperId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGuardrailModal, setShowGuardrailModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || {
    id: 'fallback',
    title: 'New Conversation',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const hasUserMessages = activeSession.messages.some(m => m.role === 'user');

  // Load user-specific sessions and activeSessionId when user changes
  useEffect(() => {
    const userEmail = user?.email || 'default';
    const storageKey = `promptflow_chat_sessions_${userEmail}`;
    const activeKey = `promptflow_active_chat_id_${userEmail}`;
    
    const savedSessions = localStorage.getItem(storageKey);
    let loadedSessions: ChatSession[] = [];
    
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedSessions = parsed.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
            messages: s.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          }));
        }
      } catch (e) {
        console.error("Failed to parse saved chat sessions", e);
      }
    }
    
    if (loadedSessions.length === 0) {
      loadedSessions = [
        {
          id: 'default-session',
          title: 'New Conversation',
          messages: [
            {
              id: 'welcome_init',
              role: 'assistant',
              text: `Hello ${user?.full_name || 'Professor'}. I am your promptFlow-AI Research Assistant. You can ask me queries about research papers, authors, departments, or publication categories in natural language. How can I help you today?`,
              timestamp: new Date()
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
    
    setSessions(loadedSessions);
    
    const savedActiveId = localStorage.getItem(activeKey);
    if (savedActiveId && loadedSessions.some(s => s.id === savedActiveId)) {
      setActiveSessionId(savedActiveId);
    } else {
      setActiveSessionId(loadedSessions[0].id);
    }
  }, [user?.email, user?.full_name]);

  // Sync to user-specific localStorage when sessions change
  useEffect(() => {
    if (user?.email && sessions.length > 0) {
      localStorage.setItem(`promptflow_chat_sessions_${user.email}`, JSON.stringify(sessions));
    }
  }, [sessions, user?.email]);

  // Sync activeSessionId when it changes
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`promptflow_active_chat_id_${user.email}`, activeSessionId);
    }
  }, [activeSessionId, user?.email]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (hasUserMessages) {
      scrollToBottom();
    }
  }, [activeSession.messages, loading, hasUserMessages, activeSessionId]);

  // Focus input when session changes or on initial render
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeSessionId, hasUserMessages]);

  const handleNewChat = () => {
    const newId = 'session_' + Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: [
        {
          id: 'welcome_' + newId,
          role: 'assistant',
          text: `Hello ${user?.full_name || 'Professor'}. I am your promptFlow-AI Research Assistant. You can ask me queries about research papers, authors, departments, or publication categories in natural language. How can I help you today?`,
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInput('');
    setExpandedPaperId(null);
  };

  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // If deleting the only session, reset it
      handleNewChat();
      setSessions(prev => prev.filter(s => s.id !== idToDelete));
      return;
    }
    
    const remaining = sessions.filter(s => s.id !== idToDelete);
    setSessions(remaining);
    if (activeSessionId === idToDelete) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleClearAllHistory = () => {
    if (!window.confirm("Are you sure you want to clear all chat history and start fresh?")) return;
    localStorage.removeItem('promptflow_chat_sessions');
    localStorage.removeItem('promptflow_active_chat_id');
    sessionStorage.removeItem('promptflow_chat_messages');
    
    const newId = 'default-session';
    const freshSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: [
        {
          id: 'welcome_' + newId,
          role: 'assistant',
          text: `Hello ${user?.full_name || 'Professor'}. I am your promptFlow-AI Research Assistant. You can ask me queries about research papers, authors, departments, or publication categories in natural language. How can I help you today?`,
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSessions([freshSession]);
    setActiveSessionId(newId);
    setInput('');
    setExpandedPaperId(null);
  };

  const suggestions = [
    "What research has Dr. Eleanor Vance published?",
    "List all Computer Science publications from 2026",
    "Show papers related to CRISPR genome editing",
    "Publications on electric vehicle battery thermal management"
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    // Check if this is the first user message in this session to update the title
    const currentMessages = activeSession.messages;
    const isFirstUserMessage = !currentMessages.some(m => m.role === 'user');
    const newTitle = isFirstUserMessage 
      ? (textToSend.length > 32 ? textToSend.slice(0, 32) + '...' : textToSend)
      : activeSession.title;

    // Update session with user message
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMessage],
          updatedAt: new Date()
        };
      }
      return s;
    }));

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
      
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, assistantMessage],
            updatedAt: new Date()
          };
        }
        return s;
      }));
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: err.response?.data?.detail || "An error occurred while connecting to the AI Assistant. Please ensure your backend is online and the Gemini API key is configured.",
        timestamp: new Date(),
        isError: true
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, errorMessage],
            updatedAt: new Date()
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Reusable Input Box Component
  const renderPilledInputBox = (isCentered: boolean) => (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleSend(input);
      }} 
      className={`relative flex items-center w-full bg-white border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 rounded-xl shadow-2xs transition-all duration-200 ${
        isCentered ? 'p-2 max-w-3xl mx-auto' : 'p-1.5 max-w-4xl mx-auto'
      }`}
    >
      <div className="pl-3 text-blue-600 flex items-center shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isCentered ? "Ask about papers, authors, departments... (e.g. 'Show Computer Science papers from 2026')" : "Ask a follow-up query or search publications..."}
        className="flex-1 bg-transparent border-none text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none placeholder:text-slate-400 font-sans"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={!input.trim() || loading}
        className="watt-btn-primary shrink-0"
      >
        <Send className="w-4 h-4 text-white stroke-[2.5]" />
      </button>
    </form>
  );

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-slate-50 relative font-sans">
      
      {/* LEFT SIDEBAR: Chat History & Sessions */}
      <div 
        className={`bg-white flex flex-col justify-between shrink-0 transition-all duration-300 z-30 overflow-hidden ${
          sidebarOpen ? 'w-64 sm:w-72 border-r border-slate-200' : 'w-0'
        }`}
      >
        {/* Sidebar Header: New Chat & Collapse */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-2">
          <button
            onClick={handleNewChat}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-2 shadow-2xs cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Close Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Middle: History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center">
                <History className="w-3 h-3 mr-1.5 text-blue-600" /> Chat History
              </span>
              <button 
                onClick={handleClearAllHistory}
                className="text-slate-400 hover:text-red-600 transition-colors text-[9px]"
                title="Clear all history"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-1">
              {sessions.map((session) => {
                const isActive = activeSessionId === session.id;
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setExpandedPaperId(null);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer group transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
                      <span className="truncate leading-normal">{session.title}</span>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className={`p-1 rounded-md hover:bg-red-50 hover:text-red-600 transition-all shrink-0 ${
                        isActive ? 'text-slate-400 hover:text-red-600' : 'opacity-0 group-hover:opacity-100 text-slate-400'
                      }`}
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


      </div>

      {/* RIGHT MAIN AREA: ChatGPT Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 relative overflow-hidden">
        
        {/* Top Navbar */}
        <div className="h-14 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-2xs">
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer mr-1"
                title="Open Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-2xs">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  promptFlow-AI Research Assistant
                </h2>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                  <span>AI Research Assistant</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGuardrailModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Scope & Policy</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE AREA: Conditional rendering based on hasUserMessages */}
        {!hasUserMessages ? (
          /* STATE A: Centered Empty/New Chat Screen (ChatGPT Style) */
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 max-w-4xl mx-auto w-full overflow-y-auto custom-scrollbar">
            
            {/* Hero Header */}
            <div className="text-center mb-8 sm:mb-10 space-y-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto shadow-xs mb-4">
                <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How can I assist your research today, {user?.full_name?.split(' ')[0] || 'Professor'}?
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                Query published literature, analyze faculty citation records, or filter departmental research archives using natural language.
              </p>
            </div>

            {/* Centered Pilled Input Box */}
            <div className="w-full mb-8">
              {renderPilledInputBox(true)}
            </div>

            {/* Relevant Questions Grid Below Input */}
            <div className="w-full max-w-3xl">
              <div className="flex items-center justify-center space-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Suggested Research Queries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-blue-500/30 text-left text-xs text-slate-700 hover:text-slate-900 transition-all duration-200 flex items-start space-x-3 group cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform border border-blue-100">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <span className="leading-relaxed font-medium pt-0.5">{s}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* STATE B: Active Chat State with Messages & Fixed Bottom Bar */
          <div className="flex-1 flex flex-col h-full min-h-0">
            
            {/* Scrollable Chat History Container */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-6">
                
                {activeSession.messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start space-x-3 sm:space-x-4'}`}>
                      
                      {/* Assistant Avatar */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                        </div>
                      )}

                      {/* Message Bubble Container */}
                      <div className={`max-w-[88%] sm:max-w-[80%] ${
                        isUser 
                          ? 'bg-blue-600 text-white rounded-3xl rounded-tr-sm px-5 py-3.5 shadow-2xs' 
                          : msg.isError 
                            ? 'bg-red-50 border border-red-200 text-red-900 rounded-3xl rounded-tl-sm px-5 py-4 shadow-2xs' 
                            : msg.response && !msg.response.is_academic_query 
                              ? 'bg-red-50 border border-red-200 text-red-900 rounded-3xl rounded-tl-sm px-5 py-4 shadow-2xs'
                              : 'bg-white border border-slate-200/80 text-slate-900 rounded-3xl rounded-tl-sm px-5 py-4 shadow-xs'
                      }`}>
                        
                        {/* Sender Info & Timestamp */}
                        <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400">
                          <span className="font-bold uppercase tracking-wider flex items-center">
                            {isUser ? 'You' : 'promptFlow-AI Research Agent'}
                          </span>
                          <span>{formatTime(msg.timestamp)}</span>
                        </div>

                        {/* Message Text */}
                        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                          {msg.text}
                        </div>

                        {/* Detected Query Filters */}
                        {msg.response && msg.response.is_academic_query && msg.response.filters && (
                          <div className="mt-4 pt-3 border-t border-slate-200">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                              <Tag className="w-3.5 h-3.5 mr-1 text-blue-600" /> Detected Search Parameters:
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-700">
                              {msg.response.filters.departments.map((dept, i) => (
                                <span key={`dept-${i}`}>
                                  Dept: {dept}
                                </span>
                              ))}
                              {msg.response.filters.authors.map((auth, i) => (
                                <span key={`auth-${i}`}>
                                  Author: {auth}
                                </span>
                              ))}
                              {msg.response.filters.years.map((year, i) => (
                                <span key={`year-${i}`}>
                                  Year: {year}
                                </span>
                              ))}
                              {msg.response.filters.categories.map((cat, i) => (
                                <span key={`cat-${i}`}>
                                  Category: {cat}
                                </span>
                              ))}
                              {msg.response.filters.title_keywords.map((kw, i) => (
                                <span key={`kw-${i}`}>
                                  Keyword: {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Guardrail Violation Box */}
                        {msg.response && !msg.response.is_academic_query && (
                          <div className="mt-3.5 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-xs text-red-800">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                            <div>
                              <strong className="block mb-0.5 font-bold text-red-900">Guardrail Policy Triggered</strong>
                              <p className="text-[11px] text-red-800 leading-normal">
                                This query falls outside research papers, authors, departments, or categories. Please try phrasing a query related directly to college publications.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Structured Database Matches Accordion List */}
                        {msg.response && msg.response.is_academic_query && msg.response.papers && msg.response.papers.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center">
                                <Database className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Structured Database Matches ({msg.response.papers.length}):
                              </span>
                              <span className="text-[10px] text-blue-600 font-normal lowercase font-mono">click paper to expand</span>
                            </div>

                            <div className="space-y-2 pt-1">
                              {msg.response.papers.map((paper) => {
                                const isExpanded = expandedPaperId === paper.id;
                                return (
                                  <div 
                                    key={paper.id}
                                    className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all"
                                  >
                                    {/* Accordion Header */}
                                    <button
                                      onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                                      className="w-full p-3.5 text-left flex items-center justify-between hover:text-blue-600 transition-colors cursor-pointer group"
                                    >
                                      <div className="min-w-0 flex-1 pr-2">
                                        <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-600 line-clamp-1 leading-normal transition-colors">
                                          {paper.title}
                                        </span>
                                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1">
                                          <span className="font-medium text-slate-700">{paper.authors_raw || paper.authors_list.join(", ")}</span>
                                          <span>•</span>
                                          <span className="text-blue-600 font-medium">{paper.department}</span>
                                          <span>•</span>
                                          <span className="font-mono text-slate-600">{paper.publication_year}</span>
                                        </div>
                                      </div>
                                      <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 ml-2 group-hover:border-blue-300">
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-blue-600 transform rotate-180 transition-all" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-all" />
                                        )}
                                      </div>
                                    </button>
                                    
                                    {/* Accordion Body */}
                                    {isExpanded && (
                                      <div className="px-4 pb-4 pt-2.5 border-t border-slate-200 space-y-3 bg-white text-xs">
                                        {/* AI Summary Callout - Clean white box */}
                                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs leading-relaxed italic text-slate-800 font-sans shadow-2xs">
                                          <span className="text-blue-600 font-bold block not-italic text-[10px] uppercase tracking-wider mb-1 flex items-center">
                                            <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" /> Executive AI Summary
                                          </span>
                                          “{paper.ai_summary || paper.abstract}”
                                        </div>
                                        
                                        {/* Metadata Metrics Table */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-500 block text-[9px] uppercase font-bold mb-0.5">Journal / Conf</span>
                                            <span className="text-slate-900 font-medium truncate block" title={paper.journal_or_conference || 'N/A'}>{paper.journal_or_conference || 'N/A'}</span>
                                          </div>
                                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-500 block text-[9px] uppercase font-bold mb-0.5">DOI Number</span>
                                            <span className="text-slate-900 font-mono truncate block" title={paper.doi || 'N/A'}>{paper.doi || 'N/A'}</span>
                                          </div>
                                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-500 block text-[9px] uppercase font-bold mb-0.5">Citations</span>
                                            <span className="text-emerald-600 font-mono font-bold block">{paper.citation_count} citations</span>
                                          </div>
                                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-500 block text-[9px] uppercase font-bold mb-0.5">ML Confidence</span>
                                            <span className="text-blue-600 font-mono font-bold block">{(paper.ml_confidence * 100).toFixed(1)}%</span>
                                          </div>
                                        </div>
                                        
                                        {/* Full Abstract - Clean white box with border */}
                                        <div>
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Abstract Text:</span>
                                          <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 max-h-32 overflow-y-auto custom-scrollbar font-sans">
                                            {paper.abstract || 'No abstract text available.'}
                                          </p>
                                        </div>
                                        
                                        {/* Actions Footer */}
                                        <div className="flex items-center justify-end space-x-2.5 pt-2.5 border-t border-slate-200">
                                          <button
                                            onClick={() => onSelectPaper(paper)}
                                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center space-x-1"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Paper Details</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (onSelectAuthor && paper.authors_raw) {
                                                const firstAuthor = paper.authors_raw.split(',')[0].trim();
                                                onSelectAuthor(firstAuthor);
                                              }
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                                          >
                                            <span>Author Profile</span>
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                          </button>
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
                          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                            No research publications in the DB match these exact search parameters.
                          </div>
                        )}

                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                          <User className="w-4 h-4 text-slate-700" />
                        </div>
                      )}

                    </div>
                  );
                })}

                {/* Loading Indicator Bubble */}
                {loading && (
                  <div className="flex justify-start space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                      <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-sm px-5 py-4 max-w-[60%] flex items-center space-x-3 shadow-xs">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">Agent is querying Scikit-Learn &amp; DB corpus...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* DOCKED BOTTOM BAR (Fixed ChatGPT Footer) */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0 z-10">
              {renderPilledInputBox(false)}
              <div className="mt-2 text-center text-[10px] text-slate-400 font-sans flex items-center justify-center space-x-2">
                <span>promptFlow-AI Research Agent v3.5 can make mistakes. Verify important citations and DOI metadata against the primary repository.</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* GUARDRAIL & SCOPE MODAL */}
      {showGuardrailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Assistant Guardrails &amp; Policy</h3>
                  <p className="text-[11px] text-slate-500">Strict academic filtering engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuardrailModal(false)}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This chat interface is explicitly designed to query the College Research Digest database. It operates under strict academic and departmental parameters to maintain high signal-to-noise ratio:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1">
                <strong className="text-blue-600 font-bold flex items-center text-xs">
                  ✅ Supported Topics &amp; Scope
                </strong>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Searching for faculty papers, looking up specific author publication history, summarizing abstracts, filtering by academic department, year, or citation count.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-900 space-y-1">
                <strong className="text-red-600 font-bold flex items-center text-xs">
                  ❌ Restricted &amp; Rejected Topics
                </strong>
                <p className="text-[11px] text-red-800 leading-normal">
                  General conversational chatter, programming/coding assistance, email administration tasks, college exam structures, and non-academic knowledge. Unrelated queries trigger immediate rejection by the NLP classification guardrail.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-mono">
              <span>Model Architecture:</span>
              <span className="text-blue-600 font-bold">Gemini 3.5 Flash + Scikit-Learn NLP</span>
            </div>

            <button
              onClick={() => setShowGuardrailModal(false)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              Got it, Continue Researching
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
