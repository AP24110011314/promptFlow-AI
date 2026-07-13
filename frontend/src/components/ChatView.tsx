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
  Info, 
  X, 
  Database,
  ExternalLink
} from 'lucide-react';
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
}

export const ChatView: React.FC<ChatViewProps> = ({ user, onSelectPaper }) => {
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
    const storageKey = `crd_chat_sessions_${userEmail}`;
    const activeKey = `crd_active_chat_id_${userEmail}`;
    
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
              text: `Hello ${user?.full_name || 'Professor'}. I am your CRD AI Research Assistant. You can ask me queries about research papers, authors, departments, or publication categories in natural language. How can I help you today?`,
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
      localStorage.setItem(`crd_chat_sessions_${user.email}`, JSON.stringify(sessions));
    }
  }, [sessions, user?.email]);

  // Sync activeSessionId when it changes
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`crd_active_chat_id_${user.email}`, activeSessionId);
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
          text: `Hello ${user?.full_name || 'Professor'}. I am your CRD AI Research Assistant. You can ask me queries about research papers, authors, departments, or publication categories in natural language. How can I help you today?`,
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
    localStorage.removeItem('crd_chat_sessions');
    localStorage.removeItem('crd_active_chat_id');
    sessionStorage.removeItem('crd_chat_messages');
    
    const newId = 'default-session';
    const freshSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: [
        {
          id: 'welcome_' + newId,
          role: 'assistant',
          text: `Hello ${user?.full_name || 'Professor'}. I am your CRD AI Research Assistant. You can ask me queries about research papers, authors, departments, or publication categories in natural language. How can I help you today?`,
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

  // Reusable Pilled Input Box Component
  const renderPilledInputBox = (isCentered: boolean) => (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleSend(input);
      }} 
      className={`relative flex items-center w-full bg-brand-card border border-brand-border/80 hover:border-brand-gray/50 focus-within:border-brand-cyan focus-within:ring-4 focus-within:ring-brand-cyan/15 rounded-full shadow-2xl transition-all duration-300 ${
        isCentered ? 'p-2 sm:p-2.5 max-w-3xl mx-auto' : 'p-1.5 sm:p-2 max-w-4xl mx-auto'
      }`}
    >
      <div className="pl-3.5 sm:pl-4 text-brand-cyan flex items-center shrink-0">
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isCentered ? "Ask about papers, authors, departments... (e.g. 'Show Computer Science papers from 2026')" : "Ask a follow-up query or search publications..."}
        className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm rounded-full px-3 py-2 sm:py-2.5 focus:outline-none placeholder:text-brand-gray/50 font-sans"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={!input.trim() || loading}
        className={`rounded-full bg-gradient-to-r from-brand-cyan to-indigo-500 hover:brightness-115 text-brand-bg font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:brightness-100 shadow-md shadow-brand-cyan/20 cursor-pointer shrink-0 ${
          isCentered ? 'w-10 h-10 sm:w-11 sm:h-11' : 'w-9 h-9 sm:w-10 sm:h-10'
        }`}
      >
        <Send className="w-4 h-4 text-brand-bg stroke-[2.5]" />
      </button>
    </form>
  );

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-brand-bg relative font-sans">
      
      {/* LEFT SIDEBAR: Chat History & Sessions */}
      <div 
        className={`bg-brand-card/95 flex flex-col justify-between shrink-0 transition-all duration-300 z-30 overflow-hidden ${
          sidebarOpen ? 'w-64 sm:w-72 border-r border-brand-border' : 'w-0'
        }`}
      >
        {/* Sidebar Header: New Chat & Collapse */}
        <div className="p-4 border-b border-brand-border/60 flex items-center space-x-2">
          <button
            onClick={handleNewChat}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan/15 to-indigo-500/15 hover:from-brand-cyan/25 hover:to-indigo-500/25 border border-brand-cyan/35 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-brand-cyan group-hover:rotate-90 transition-transform" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2.5 rounded-xl bg-brand-bg hover:bg-brand-hover border border-brand-border text-brand-gray hover:text-white transition-all cursor-pointer"
            title="Close Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Middle: History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-bold text-brand-gray uppercase tracking-wider">
              <span className="flex items-center">
                <History className="w-3 h-3 mr-1.5 text-brand-cyan" /> Chat History
              </span>
              <button 
                onClick={handleClearAllHistory}
                className="text-brand-gray/60 hover:text-brand-red transition-colors text-[9px]"
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
                        ? 'bg-brand-cyan/15 text-white font-semibold border border-brand-cyan/40 shadow-sm shadow-brand-cyan/5'
                        : 'text-brand-gray hover:bg-brand-bg hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-cyan' : 'text-brand-gray group-hover:text-brand-cyan'}`} />
                      <span className="truncate leading-normal">{session.title}</span>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className={`p-1 rounded-md hover:bg-brand-red/20 hover:text-brand-red transition-all shrink-0 ${
                        isActive ? 'text-brand-gray hover:text-brand-red' : 'opacity-0 group-hover:opacity-100 text-brand-gray'
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

        {/* Sidebar Footer: Guardrails & Engine Info */}
        <div className="p-3 border-t border-brand-border/60 bg-brand-bg/40">
          <button
            onClick={() => setShowGuardrailModal(true)}
            className="w-full p-2.5 rounded-xl bg-brand-card border border-brand-border hover:border-brand-cyan/40 text-left transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/25 text-brand-cyan shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-white block truncate group-hover:text-brand-cyan transition-colors">
                  Academic Guardrails
                </span>
                <span className="text-[9px] text-brand-gray block truncate">
                  Gemini 3.5 Flash • Active
                </span>
              </div>
            </div>
            <Info className="w-3.5 h-3.5 text-brand-gray group-hover:text-brand-cyan shrink-0 ml-1" />
          </button>
        </div>
      </div>

      {/* RIGHT MAIN AREA: ChatGPT Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-brand-bg relative overflow-hidden">
        
        {/* Top Navbar */}
        <div className="h-14 px-4 sm:px-6 bg-brand-card/70 backdrop-blur-md border-b border-brand-border/80 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl bg-brand-bg hover:bg-brand-hover border border-brand-border text-brand-gray hover:text-white transition-all cursor-pointer mr-1"
                title="Open Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-indigo-500/20 border border-brand-cyan/40 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-brand-cyan" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white leading-tight flex items-center">
                  CRD Research Assistant
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan text-[9px] font-mono font-semibold border border-brand-cyan/30">
                    v3.5
                  </span>
                </h2>
                <div className="flex items-center space-x-1.5 text-[10px] text-brand-gray">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse inline-block" />
                  <span>College Research Digest • Natural Language DB Engine</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGuardrailModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-brand-bg hover:bg-brand-hover border border-brand-border text-brand-gray hover:text-white text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-brand-cyan" />
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-cyan/20 via-indigo-500/20 to-brand-cyan/10 border border-brand-cyan/40 flex items-center justify-center mx-auto shadow-xl shadow-brand-cyan/10 mb-4">
                <Sparkles className="w-8 h-8 text-brand-cyan animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                How can I assist your research today, {user?.full_name?.split(' ')[0] || 'Professor'}?
              </h1>
              <p className="text-xs sm:text-sm text-brand-gray max-w-lg mx-auto leading-relaxed">
                Query published literature, analyze faculty citation records, or filter departmental research archives using natural language.
              </p>
            </div>

            {/* Centered Pilled Input Box */}
            <div className="w-full mb-8">
              {renderPilledInputBox(true)}
            </div>

            {/* Relevant Questions Grid Below Input */}
            <div className="w-full max-w-3xl">
              <div className="flex items-center justify-center space-x-2 text-[11px] font-bold text-brand-gray uppercase tracking-wider mb-3.5">
                <Compass className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Suggested Research Queries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="p-4 rounded-2xl bg-brand-card/80 hover:bg-brand-card border border-brand-border/80 hover:border-brand-cyan/50 text-left text-xs text-brand-gray hover:text-white transition-all duration-200 flex items-start space-x-3 group cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="w-7 h-7 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan shrink-0 mt-0.5 group-hover:scale-110 transition-transform border border-brand-cyan/20">
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
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-cyan/20 to-indigo-500/20 border border-brand-cyan/40 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                          <Sparkles className="w-4 h-4 text-brand-cyan" />
                        </div>
                      )}

                      {/* Message Bubble Container */}
                      <div className={`max-w-[88%] sm:max-w-[80%] ${
                        isUser 
                          ? 'bg-gradient-to-br from-brand-cyan/25 to-brand-cyan/10 text-white border border-brand-cyan/40 rounded-3xl rounded-tr-sm px-5 py-3.5 shadow-md' 
                          : msg.isError 
                            ? 'bg-brand-red/10 border border-brand-red/25 text-white rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm' 
                            : msg.response && !msg.response.is_academic_query 
                              ? 'bg-brand-red/5 border border-brand-red/20 text-white rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm'
                              : 'bg-brand-card/90 border border-brand-border text-white rounded-3xl rounded-tl-sm px-5 py-4 shadow-md'
                      }`}>
                        
                        {/* Sender Info & Timestamp */}
                        <div className="flex items-center justify-between mb-1.5 text-[10px] text-brand-gray/80">
                          <span className="font-bold uppercase tracking-wider flex items-center">
                            {isUser ? 'You' : 'CRD Research Agent'}
                          </span>
                          <span>{formatTime(msg.timestamp)}</span>
                        </div>

                        {/* Message Text */}
                        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                          {msg.text}
                        </div>

                        {/* Detected Query Filters */}
                        {msg.response && msg.response.is_academic_query && msg.response.filters && (
                          <div className="mt-4 pt-3 border-t border-brand-border/60">
                            <div className="text-[10px] font-bold text-brand-gray uppercase tracking-wider mb-2 flex items-center">
                              <Tag className="w-3.5 h-3.5 mr-1 text-brand-cyan" /> Detected Search Parameters:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.response.filters.departments.map((dept, i) => (
                                <span key={`dept-${i}`} className="px-2.5 py-1 rounded-full bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan text-[10px] font-semibold font-mono">
                                  Dept: {dept}
                                </span>
                              ))}
                              {msg.response.filters.authors.map((auth, i) => (
                                <span key={`auth-${i}`} className="px-2.5 py-1 rounded-full bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan text-[10px] font-semibold font-mono">
                                  Author: {auth}
                                </span>
                              ))}
                              {msg.response.filters.years.map((year, i) => (
                                <span key={`year-${i}`} className="px-2.5 py-1 rounded-full bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan text-[10px] font-semibold font-mono">
                                  Year: {year}
                                </span>
                              ))}
                              {msg.response.filters.categories.map((cat, i) => (
                                <span key={`cat-${i}`} className="px-2.5 py-1 rounded-full bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan text-[10px] font-semibold font-mono">
                                  Category: {cat}
                                </span>
                              ))}
                              {msg.response.filters.title_keywords.map((kw, i) => (
                                <span key={`kw-${i}`} className="px-2.5 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-semibold font-mono">
                                  Keyword: {kw}
                                </span>
                              ))}
                              {msg.response.filters.general_query && (
                                <span className="px-2.5 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-semibold font-mono">
                                  Search: {msg.response.filters.general_query}
                                </span>
                              )}
                              {!msg.response.filters.departments.length && 
                               !msg.response.filters.authors.length && 
                               !msg.response.filters.years.length && 
                               !msg.response.filters.categories.length && 
                               !msg.response.filters.title_keywords.length && 
                               !msg.response.filters.general_query && (
                                <span className="px-2.5 py-1 rounded-full bg-brand-border text-brand-gray text-[10px] font-mono">
                                  Broad Academic Search
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Guardrail Violation Box */}
                        {msg.response && !msg.response.is_academic_query && (
                          <div className="mt-3.5 p-3 rounded-2xl bg-brand-red/10 border border-brand-red/25 flex items-start space-x-2.5 text-xs text-brand-red">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block mb-0.5 font-bold">Guardrail Policy Triggered</strong>
                              <p className="text-[11px] text-brand-red/90 leading-normal">
                                This query falls outside research papers, authors, departments, or categories. Please try phrasing a query related directly to college publications.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Structured Database Matches Accordion List */}
                        {msg.response && msg.response.is_academic_query && msg.response.papers && msg.response.papers.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-brand-border/60 space-y-2.5">
                            <div className="text-[11px] font-bold text-brand-gray uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span className="flex items-center">
                                <Database className="w-3.5 h-3.5 mr-1.5 text-brand-cyan" /> Structured Database Matches ({msg.response.papers.length}):
                              </span>
                              <span className="text-[10px] text-brand-cyan font-normal lowercase font-mono">click paper to expand</span>
                            </div>
                            <div className="space-y-2">
                              {msg.response.papers.map((paper) => {
                                const isExpanded = expandedPaperId === paper.id;
                                return (
                                  <div 
                                    key={paper.id}
                                    className="border border-brand-border/80 rounded-2xl overflow-hidden bg-brand-bg/60 hover:bg-brand-bg transition-all shadow-sm"
                                  >
                                    {/* Accordion Header */}
                                    <button
                                      onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                                      className="w-full p-3.5 text-left flex items-center justify-between hover:text-brand-cyan transition-colors cursor-pointer group"
                                    >
                                      <div className="max-w-[88%] space-y-1">
                                        <span className="text-xs font-bold text-white block group-hover:text-brand-cyan line-clamp-1 leading-normal transition-colors">
                                          {paper.title}
                                        </span>
                                        <div className="flex items-center space-x-2 text-[10px] text-brand-gray">
                                          <span className="font-medium text-white/85">{paper.authors_raw || paper.authors_list.join(", ")}</span>
                                          <span>•</span>
                                          <span className="text-brand-cyan/90 font-medium">{paper.department}</span>
                                          <span>•</span>
                                          <span className="font-mono bg-brand-border/60 px-1.5 py-0.2 rounded text-white/90">{paper.publication_year}</span>
                                        </div>
                                      </div>
                                      <div className="w-7 h-7 rounded-full bg-brand-card border border-brand-border flex items-center justify-center shrink-0 ml-2 group-hover:border-brand-cyan/40">
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-brand-cyan transform rotate-180 transition-all" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-brand-gray group-hover:text-brand-cyan transition-all" />
                                        )}
                                      </div>
                                    </button>
                                    
                                    {/* Accordion Body */}
                                    {isExpanded && (
                                      <div className="px-4 pb-4 pt-2.5 border-t border-brand-border/60 space-y-3 bg-brand-card/40 text-xs">
                                        {/* AI Summary Callout */}
                                        <div className="p-3.5 rounded-xl bg-brand-bg/80 border-l-4 border-brand-cyan text-xs leading-relaxed italic text-white/95 font-sans shadow-inner">
                                          <span className="text-brand-cyan font-bold block not-italic text-[10px] uppercase tracking-wider mb-1 flex items-center">
                                            <Sparkles className="w-3.5 h-3.5 mr-1" /> Executive AI Summary
                                          </span>
                                          “{paper.ai_summary || paper.abstract}”
                                        </div>
                                        
                                        {/* Metadata Metrics Table */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                                          <div className="p-2.5 rounded-xl bg-brand-bg/60 border border-brand-border/60">
                                            <span className="text-brand-gray block text-[9px] uppercase font-bold mb-0.5">Journal / Conf</span>
                                            <span className="text-white font-medium truncate block" title={paper.journal_or_conference || 'N/A'}>{paper.journal_or_conference || 'N/A'}</span>
                                          </div>
                                          <div className="p-2.5 rounded-xl bg-brand-bg/60 border border-brand-border/60">
                                            <span className="text-brand-gray block text-[9px] uppercase font-bold mb-0.5">DOI Number</span>
                                            <span className="text-white font-mono truncate block" title={paper.doi || 'N/A'}>{paper.doi || 'N/A'}</span>
                                          </div>
                                          <div className="p-2.5 rounded-xl bg-brand-bg/60 border border-brand-border/60">
                                            <span className="text-brand-gray block text-[9px] uppercase font-bold mb-0.5">Citations</span>
                                            <span className="text-brand-green font-mono font-bold block">{paper.citation_count} citations</span>
                                          </div>
                                          <div className="p-2.5 rounded-xl bg-brand-bg/60 border border-brand-border/60">
                                            <span className="text-brand-gray block text-[9px] uppercase font-bold mb-0.5">ML Confidence</span>
                                            <span className="text-brand-cyan font-mono font-bold block">{(paper.ml_confidence * 100).toFixed(1)}%</span>
                                          </div>
                                        </div>
                                        
                                        {/* Full Abstract */}
                                        <div>
                                          <span className="text-[10px] font-bold text-brand-gray uppercase tracking-wider block mb-1">Abstract Text:</span>
                                          <p className="text-[11px] text-brand-gray leading-relaxed bg-brand-bg/50 p-3 rounded-xl border border-brand-border/60 max-h-32 overflow-y-auto custom-scrollbar font-sans">
                                            {paper.abstract || 'No abstract text available.'}
                                          </p>
                                        </div>
                                        
                                        {/* Actions Footer */}
                                        <div className="flex items-center justify-end space-x-2.5 pt-2.5 border-t border-brand-border/40">
                                          <button
                                            onClick={() => onSelectPaper(paper)}
                                            className="px-3 py-1.5 rounded-xl bg-brand-bg hover:bg-brand-hover text-white border border-brand-border text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center space-x-1"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-brand-cyan" />
                                            <span>Full Metadata Modal</span>
                                          </button>
                                          {paper.pdf_url && (
                                            <a
                                              href={`${SERVER_BASE_URL}${paper.pdf_url}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-3 py-1.5 rounded-xl bg-brand-cyan/20 hover:bg-brand-cyan/35 border border-brand-cyan/40 text-brand-cyan text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
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
                          <div className="mt-4 p-3.5 rounded-2xl bg-brand-bg/80 border border-brand-border text-center text-xs text-brand-gray font-medium">
                            No research publications in the DB match these exact search parameters.
                          </div>
                        )}

                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center shrink-0 mt-1 shadow-sm">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}

                    </div>
                  );
                })}

                {/* Loading Indicator Bubble */}
                {loading && (
                  <div className="flex justify-start space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-cyan/20 to-indigo-500/20 border border-brand-cyan/40 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Sparkles className="w-4 h-4 text-brand-cyan animate-spin" />
                    </div>
                    <div className="bg-brand-card/90 border border-brand-border rounded-3xl rounded-tl-sm px-5 py-4 max-w-[60%] flex items-center space-x-3 shadow-md">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-brand-gray font-semibold">Agent is querying Scikit-Learn & DB corpus...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* DOCKED BOTTOM BAR (Fixed ChatGPT Footer) */}
            <div className="p-3 sm:p-4 bg-gradient-to-t from-brand-bg via-brand-bg/95 to-brand-bg/80 backdrop-blur-md border-t border-brand-border/60 shrink-0 z-10">
              {renderPilledInputBox(false)}
              <div className="mt-2 text-center text-[10px] text-brand-gray/70 font-sans flex items-center justify-center space-x-2">
                <span>CRD Research Agent v3.5 can make mistakes. Verify important citations and DOI metadata against the primary repository.</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* GUARDRAIL & SCOPE MODAL */}
      {showGuardrailModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-brand-card border border-brand-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-red/15 border border-brand-red/35 flex items-center justify-center text-brand-red">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Assistant Guardrails & Policy</h3>
                  <p className="text-[11px] text-brand-gray">Strict academic filtering engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuardrailModal(false)}
                className="p-1.5 rounded-xl bg-brand-bg hover:bg-brand-hover text-brand-gray hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-brand-gray leading-relaxed">
              This chat interface is explicitly designed to query the College Research Digest database. It operates under strict academic and departmental parameters to maintain high signal-to-noise ratio:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 text-white space-y-1">
                <strong className="text-brand-cyan font-bold flex items-center text-xs">
                  ✅ Supported Topics & Scope
                </strong>
                <p className="text-[11px] text-brand-gray leading-normal">
                  Searching for faculty papers, looking up specific author publication history, summarizing abstracts, filtering by academic department, year, or citation count.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-red/10 border border-brand-red/30 text-white space-y-1">
                <strong className="text-brand-red font-bold flex items-center text-xs">
                  ❌ Restricted & Rejected Topics
                </strong>
                <p className="text-[11px] text-brand-red/90 leading-normal">
                  General conversational chatter, programming/coding assistance, email administration tasks, college exam structures, and non-academic knowledge. Unrelated queries trigger immediate rejection by the NLP classification guardrail.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-bg border border-brand-border text-[11px] text-brand-gray flex items-center justify-between font-mono">
              <span>Model Architecture:</span>
              <span className="text-brand-cyan font-bold">Gemini 3.5 Flash + Scikit-Learn NLP</span>
            </div>

            <button
              onClick={() => setShowGuardrailModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-indigo-500 hover:brightness-115 text-brand-bg font-bold text-xs transition-all shadow-lg shadow-brand-cyan/15 cursor-pointer"
            >
              Got it, Continue Researching
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
