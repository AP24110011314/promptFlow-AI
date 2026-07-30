import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ShieldAlert, UserCheck, CheckCircle, 
  Cpu, Inbox, HelpCircle, Database
} from 'lucide-react';

const MetallicNail: React.FC = () => (
  <svg 
    className="absolute -top-4 -left-4 w-8 h-8 select-none pointer-events-none z-30" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer edge of the nail head */}
    <circle cx="12" cy="12" r="9" fill="url(#nailGradient)" stroke="#3A3A3A" strokeWidth="1" />
    {/* Inner highlight (3D shine) */}
    <circle cx="9" cy="9" r="4" fill="url(#nailShine)" opacity="0.75" />
    {/* Subtle center dimple */}
    <circle cx="12" cy="12" r="1.5" fill="#2E2E2E" />
    
    <defs>
      <radialGradient id="nailGradient" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#F5F5F5" />
        <stop offset="40%" stopColor="#A8A8A8" />
        <stop offset="85%" stopColor="#5E5E5E" />
        <stop offset="100%" stopColor="#3A3A3A" />
      </radialGradient>
      <radialGradient id="nailShine" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);
import type { ResearchPaper, DashboardAnalytics } from '../types';

interface LandingPageViewProps {
  papers: ResearchPaper[];
  analytics: DashboardAnalytics | null;
  onSignInClick: () => void;
  onGoToConsoleClick: () => void;
  isLoggedIn: boolean;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ 
  papers,
  analytics,
  onSignInClick, 
  onGoToConsoleClick,
  isLoggedIn 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Monitor scroll to shrink floating navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Force scroll to top on page load/refresh
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    // Double safeguard to catch browser load scroll overrides
    const tId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    return () => clearTimeout(tId);
  }, []);

  const [triggerAnimationSection, setTriggerAnimationSection] = useState<string | null>(null);

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    // Replace URL hash to avoid pushing entries to the browser history
    window.history.replaceState({ page: 'landing' }, '', `#${targetId}`);

    // Instant jump to target section (removes the sliding scroll duration)
    targetElement.scrollIntoView({ behavior: 'auto' });

    // Trigger section entrance animation immediately
    setTriggerAnimationSection(targetId);
    
    // Reset trigger after animation completes
    setTimeout(() => {
      setTriggerAnimationSection(null);
    }, 1000);
  };

  const introSceneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: introProgress } = useScroll({
    target: introSceneRef,
    offset: ['start start', 'end end'],
  });
  // The card leaves first; the image remains, then moves away to reveal content.
  const heroY = useTransform(introProgress, [0, 0.5], ['0%', '-115%']);
  const heroOpacity = useTransform(introProgress, [0.38, 0.5], [1, 0]);
  const imageY = useTransform(introProgress, [0.5, 1], ['0%', '-80%']);

  // Statistics values
  const totalPapers = analytics?.total_papers || papers.length || 0;
  const totalAuthors = analytics?.total_authors || 0;
  const avgConfidence = analytics?.avg_ml_confidence
    ? `${(analytics.avg_ml_confidence * 100).toFixed(1)}%` 
    : '98.5%';

  const faqs = [
    {
      question: "How does the ML Classifier filter out spam?",
      answer: "The system features a Scikit-Learn pipeline using TF-IDF n-gram vectorization and a Naive Bayes model trained specifically on academic communication. It flags administrative requests, meeting links, and generic announcements, saving only relevant research publications to the central SQLite database."
    },
    {
      question: "What capabilities are restricted to the Administrator role?",
      answer: "Administrators (RBAC protected) can upload PDF documents, trigger automated email ingestion checks, monitor real-time sync logs, retrain the Scikit-Learn classification pipelines on a new corpus, and create custom research categories."
    },
    {
      question: "How does the TF-IDF Extractive Summarizer compute summaries?",
      answer: "Rather than using generic external APIs, the system utilizes a local extractive summarizer. It tokenizes the publication body into sentences, calculates TF-IDF scores for the vocabulary, ranks each sentence based on structural importance, and selects the top-scoring sentences."
    }
  ];

  return (
    <div className="min-h-screen bg-real-white text-[#1E1E1E] font-sans overflow-x-hidden relative selection:bg-[#F4F0EB] selection:text-[#1E1E1E]">

      {/* 1. FLOATING NAVBAR */}
      {!isLoggedIn && (
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl rounded-xl border border-black/5 transition-all duration-300 ${
            scrolled 
              ? "py-2.5 px-5 bg-real-white/90 backdrop-blur-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.04)]" 
              : "py-3 px-6 bg-real-white/45 backdrop-blur-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo on Left */}
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1E1E1E] text-real-white flex items-center justify-center font-bold text-xs shadow-sm">
                p
              </div>
              <span className="font-display font-bold text-base tracking-tight text-[#1E1E1E]">promptflow</span>
            </div>

            {/* Navigation Links centered */}
            <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-[#6E6E73] tracking-wider uppercase">
              <a href="#benefits" onClick={(e) => handleNavLinkClick(e, 'benefits')} className="hover:text-black transition-colors">Benefits</a>
              <a href="#pipeline" onClick={(e) => handleNavLinkClick(e, 'pipeline')} className="hover:text-black transition-colors">How it works</a>
              <a href="#roles" onClick={(e) => handleNavLinkClick(e, 'roles')} className="hover:text-black transition-colors">Security</a>
              <a href="#faqs" onClick={(e) => handleNavLinkClick(e, 'faqs')} className="hover:text-black transition-colors">FAQ</a>
            </nav>

            {/* CTA on Right */}
            <div className="flex items-center">
              <button 
                onClick={onSignInClick}
                className="px-5 py-2 rounded-lg bg-[#F4F0EB] text-[#1E1E1E] border border-black/5 text-xs font-bold hover:bg-[#eae6e1] transition-all duration-200 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        </motion.header>
      )}

      {/*
        2. INTRODUCTION SCROLL SEQUENCE
      */}
      <div ref={introSceneRef} className="relative z-20 h-[200svh]">
        <section className="sticky top-0 h-svh w-full overflow-hidden bg-real-white">
          <motion.div style={{ y: imageY }} className="absolute inset-x-0 top-0 h-[115%] z-10">
            <motion.div
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full relative"
            >
              <img
                src="/Laptop-background-image.jpeg"
                alt="Library Background"
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-x-0 -bottom-px h-[calc(28svh+1px)] bg-linear-to-b from-transparent via-real-white/65 to-real-white"
                aria-hidden="true"
              />
            </motion.div>
          </motion.div>
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="absolute inset-0 z-20 flex items-center justify-center px-4 py-24 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="w-[94%] max-w-5xl bg-real-white rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-black/5 flex flex-col justify-center items-center p-12 md:p-20 text-center pointer-events-auto"
            >
              {/* Category label */}
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8E8E93] mb-6">
                Academic Research Catalog
              </span>

              <h1 className="font-display text-5xl sm:text-6xl md:text-[52px] font-normal tracking-tight text-[#1E1E1E] leading-[1.05] max-w-3xl">
                <span>Track more. </span>
                <span className="text-[#8E8E93]">Read less.</span>
              </h1>

              <p className="text-[#6E6E73] text-base sm:text-lg max-w-xl mt-6 leading-relaxed font-normal">
                Streamline academic research ingestion. Classify faculty updates using ML, parse DOIs automatically, and query insights via the AI literature assistant.
              </p>

              <div className="mt-10">
                {isLoggedIn ? (
                  <button 
                    onClick={onGoToConsoleClick}
                    className="px-8 py-3.5 rounded-lg bg-[#1E1E1E] text-real-white font-bold text-sm sm:text-base hover:brightness-110 shadow-sm transition-all cursor-pointer flex items-center space-x-2.5"
                  >
                    <span>Launch Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={onSignInClick}
                    className="px-8 py-3.5 rounded-lg bg-[#1E1E1E] text-real-white font-bold text-sm sm:text-base hover:brightness-110 shadow-sm transition-all cursor-pointer flex items-center space-x-2.5"
                  >
                    <span>Access Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </section>
      </div>

      {/* 3. THE FEATURE GRID */}
      <main className="relative z-10 -mt-[calc(100svh+2px)] bg-real-white">
      <motion.section 
        id="benefits" 
        animate={triggerAnimationSection === 'benefits' ? { opacity: [0, 1], scale: [0.93, 1], y: [50, 0] } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 bg-real-white pt-24 pb-6 max-w-5xl mx-auto px-6 shadow-[0_-12px_40px_rgba(0,0,0,0.03)] rounded-t-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Card 1: Relevance Filtering */}
          <div className="bg-[#F5F5F7] border border-black/5 rounded-xl p-7 hover:shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
            {/* Visual element at top */}
            <div className="w-full bg-real-white border border-black/5 rounded-lg p-4 flex flex-col justify-between font-sans text-xs text-[#6E6E73] shadow-[0_1px_3px_rgba(0,0,0,0.01)] mb-6">
              <div className="flex items-center justify-between border-b border-black/5 pb-2 text-[11px] text-[#8E8E93] font-mono tracking-wider font-semibold">
                <span>INBOUND EMAIL</span>
                <span className="text-emerald-600 font-bold">RESEARCH</span>
              </div>
              <p className="line-clamp-2 leading-relaxed text-[#1E1E1E] my-3 font-medium">"I am pleased to share our research has been accepted in IEEE Signal Processing..."</p>
              <div className="flex items-center justify-between pt-2 border-t border-black/5 text-[11px] text-[#8E8E93]">
                <span>Relevance Score</span>
                <span className="text-[#1E1E1E] font-bold">99.2%</span>
              </div>
            </div>

            {/* Typography flow below */}
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#8E8E93] uppercase mb-1.5 block">ML Ingestion</span>
              <h3 className="text-2xl font-bold text-[#1E1E1E] leading-tight mb-2">Relevance Filtering</h3>
              <p className="text-sm font-normal text-[#6E6E73] leading-relaxed">
                Identifies academic research publications from incoming mail streams while discarding administrative spam.
              </p>
            </div>
          </div>

          {/* Card 2: Extractive Summarization */}
          <div className="bg-[#F5F5F7] border border-black/5 rounded-xl p-7 hover:shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
            {/* Visual element at top */}
            <div className="w-full bg-real-white border border-black/5 rounded-lg p-4 flex flex-col justify-between font-sans text-xs text-[#6E6E73] shadow-[0_1px_3px_rgba(0,0,0,0.01)] mb-6">
              <span className="text-[10px] font-semibold tracking-wider text-[#8E8E93] uppercase mb-2 block font-mono">Abstract summary</span>
              <p className="leading-relaxed text-[#1E1E1E] italic line-clamp-3">
                "We present a framework that improves metadata classification bounds by 14% using TF-IDF sentence token weights."
              </p>
            </div>

            {/* Typography flow below */}
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#8E8E93] uppercase mb-1.5 block">NLP Analysis</span>
              <h3 className="text-2xl font-bold text-[#1E1E1E] leading-tight mb-2">Text Summarization</h3>
              <p className="text-sm font-normal text-[#6E6E73] leading-relaxed">
                Generates summaries of research paper abstracts using local TF-IDF sentence extraction.
              </p>
            </div>
          </div>

          {/* Card 3: Chat Assistant */}
          <div className="bg-[#F5F5F7] border border-black/5 rounded-xl p-7 hover:shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
            {/* Visual element at top */}
            <div className="w-full bg-real-white border border-black/5 rounded-lg p-4 flex flex-col space-y-2.5 font-sans text-xs shadow-[0_1px_3px_rgba(0,0,0,0.01)] mb-6">
              <div className="bg-[#F8F9FA] p-2.5 rounded-md text-[#6E6E73] self-end max-w-[85%] border border-black/5">
                "neural net papers"
              </div>
              <div className="bg-[#F4F0EB] p-2.5 rounded-md text-[#1E1E1E] self-start max-w-[85%] border border-black/5 font-medium">
                "Found 3 articles under CS."
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold tracking-wider text-[#8E8E93] uppercase mb-1.5 block">Assistant</span>
              <h3 className="text-2xl font-bold text-[#1E1E1E] leading-tight mb-2">Literature Search</h3>
              <p className="text-sm font-normal text-[#6E6E73] leading-relaxed">
                Query the publication index directly using standard natural language questions.
              </p>
            </div>
          </div>

        </div>
      </motion.section>

      {/* 4. STATISTICS SECTION */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.93, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 bg-real-white pt-4 pb-20 max-w-5xl mx-auto px-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="bg-[#F5F5F7] p-8 rounded-xl border border-black/5">
            <div className="font-display text-5xl font-extrabold text-[#1E1E1E]">{totalPapers}</div>
            <p className="text-xs uppercase tracking-widest text-[#1E1E1E] font-bold mt-3 font-mono">Indexed Publications</p>
            <p className="text-xs text-[#6E6E73] mt-1.5 max-w-xs mx-auto">Total academic research papers successfully parsed and verified in the catalog</p>
          </div>
          <div className="bg-[#F5F5F7] p-8 rounded-xl border border-black/5">
            <div className="font-display text-5xl font-extrabold text-[#1E1E1E]">{avgConfidence}</div>
            <p className="text-xs uppercase tracking-widest text-[#1E1E1E] font-bold mt-3 font-mono">Ingestion Accuracy</p>
            <p className="text-xs text-[#6E6E73] mt-1.5 max-w-xs mx-auto">Vetted classifier confidence score based on automated pipeline classifications</p>
          </div>
          <div className="bg-[#F5F5F7] p-8 rounded-xl border border-black/5">
            <div className="font-display text-5xl font-extrabold text-[#1E1E1E]">{totalAuthors || 8}</div>
            <p className="text-xs uppercase tracking-widest text-[#1E1E1E] font-bold mt-3 font-mono">Faculty Authors</p>
            <p className="text-xs text-[#6E6E73] mt-1.5 max-w-xs mx-auto">Total individual faculty authors registered and parsed in the system catalog</p>
          </div>
        </div>
      </motion.section>

      {/* 5. DATA INGESTION WORKFLOW */}
      <motion.section 
        id="pipeline" 
        animate={triggerAnimationSection === 'pipeline' ? { opacity: [0, 1], scale: [0.93, 1], y: [40, 0] } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 bg-[#FDFDFD] py-24 border-y border-black/5"
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center rounded-md border border-black/10 bg-[#F4F0EB] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#4A4A4A]">Architecture</span>            
            <h2 className="font-display text-3xl font-bold text-[#1E1E1E] mt-4 tracking-tight">The Ingestion Pipeline</h2>
            <p className="text-sm text-[#6E6E73] mt-2 leading-relaxed font-medium">
              How promptFlow-AI processes, tags, parses, and catalogs academic research papers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="p-6 bg-[#F5F5F7] rounded-xl border border-black/5 relative hover:shadow-sm transition-all duration-300">
              <MetallicNail />
              <div className="flex items-center gap-3 mb-4">
                <Inbox className="w-5 h-5 text-[#1E1E1E]" />
                <h4 className="font-display text-base font-bold text-[#1E1E1E]">
                  Email Poll
                </h4>
              </div>
              <p className="text-sm leading-6 text-[#6E6E73]">
                System retrieves incoming emails from faculty mailboxes or accepts simulated payloads.
              </p>
            </div>

            <div className="p-6 bg-[#F5F5F7] rounded-xl border border-black/5 relative hover:shadow-sm transition-all duration-300">
              <MetallicNail />
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-5 h-5 text-[#1E1E1E]" />
                <h4 className="font-display text-base font-bold text-[#1E1E1E]">
                  ML Relevance
                </h4>
              </div>
              <p className="text-sm leading-6 text-[#6E6E73]">
                Text is evaluated using TF-IDF pipelines to filter non-research emails automatically.
              </p>
            </div>

            <div className="p-6 bg-[#F5F5F7] rounded-xl border border-black/5 relative hover:shadow-sm transition-all duration-300">
              <MetallicNail />
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="w-5 h-5 text-[#1E1E1E]" />
                <h4 className="font-display text-base font-bold text-[#1E1E1E]">
                  Metadata Extraction
                </h4>
              </div>
              <p className="text-sm leading-6 text-[#6E6E73]">
                Extracts authors, DOI, journal details, and generates concise AI-powered summaries.
              </p>
            </div>

            <div className="p-6 bg-[#F5F5F7] rounded-xl border border-black/5 relative hover:shadow-sm transition-all duration-300">
              <MetallicNail />
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-[#1E1E1E]" />
                <h4 className="font-display text-base font-bold text-[#1E1E1E]">
                  Repository
                </h4>
              </div>
              <p className="text-sm leading-6 text-[#6E6E73]">
                Publications are indexed, organized by department, and instantly searchable.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 6. PRIVILEGES & ACCOUNTS CONFIG */}
      <motion.section 
        id="roles" 
        animate={triggerAnimationSection === 'roles' ? { opacity: [0, 1], scale: [0.93, 1], y: [40, 0] } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 bg-real-white py-24 max-w-5xl mx-auto px-6"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center rounded-md border border-black/10 bg-[#F4F0EB] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#4A4A4A]">Privileges</span>            
          <h2 className="font-display text-3xl font-bold text-[#1E1E1E] mt-4 tracking-tight">System Roles</h2>
          <p className="text-sm text-[#6E6E73] mt-2 leading-relaxed font-medium">
            Review the seeded accounts configured for testing both administrators and faculty views.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Admin Role Card */}
            <div className="bg-[#F5F5F7] p-8 rounded-xl border border-black/5 flex flex-col justify-between hover:shadow-sm transition-all duration-300">
              <div>
                <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-900 px-3 py-1 rounded-md border border-amber-500/25 text-xs font-bold uppercase mb-4 font-mono">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Admin / Dean Role</span>
                </div>
                <h3 className="font-display font-bold text-xl text-[#1E1E1E]">Full Ingestion Control</h3>
                <p className="text-sm text-[#6E6E73] mt-3 leading-relaxed">
                  Administrators oversee the institution's publication catalog, retrain classifiers, and configure pipeline parameters.
                </p>

                <ul className="mt-6 space-y-3.5 text-sm text-[#6E6E73]">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-[#1E1E1E] shrink-0" />
                    <span>Upload PDFs directly and initiate instant metadata extraction</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-[#1E1E1E] shrink-0" />
                    <span>Force-retrain the Scikit-Learn Naive Bayes ML models</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-[#1E1E1E] shrink-0" />
                    <span>Simulate incoming faculty email arrivals and inspect pipeline logs</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Faculty Role Card */}
            <div className="bg-[#F5F5F7] p-8 rounded-xl border border-black/5 flex flex-col justify-between hover:shadow-sm transition-all duration-300">
              <div>
                <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-900 px-3 py-1 rounded-md border border-emerald-500/25 text-xs font-bold uppercase mb-4 font-mono">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Faculty / Scholar Role</span>
                </div>
                <h3 className="font-display font-bold text-xl text-[#1E1E1E]">Research Discovery</h3>
                <p className="text-sm text-[#6E6E73] mt-3 leading-relaxed">
                  Faculty members can search the publications repository, view department insights, and query the database via natural language.
                </p>

                <ul className="mt-6 space-y-3.5 text-sm text-[#6E6E73]">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-[#1E1E1E] shrink-0" />
                    <span>Search across filtered papers by authors, department, categories, or year</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-[#1E1E1E] shrink-0" />
                    <span>Chat with the integrated AI Assistant to list papers and analyze trends</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-[#1E1E1E] shrink-0" />
                    <span>Export reports and download custom lists as PDF or Excel spreadsheets</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Spiral Binding (Desktop only) */}
          <div className="hidden lg:flex flex-col justify-between absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-12 z-30 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="relative flex items-center justify-between w-full h-8">
                <svg className="w-full h-4 absolute left-0 top-2 z-20" viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M 5 11 C 12 1, 36 -2, 43 5" 
                    stroke="rgba(0,0,0,0.18)" 
                    strokeWidth="3.2" 
                    strokeLinecap="round"
                    className="blur-[0.5px]"
                    transform="translate(0.5, 1.5)"
                  />
                  <path 
                    d="M 5 11 C 12 1, 36 -2, 43 5" 
                    stroke="url(#spiralMetal)" 
                    strokeWidth="3.2" 
                    strokeLinecap="round" 
                  />
                  <path 
                    d="M 5 11 C 12 1, 36 -2, 43 5" 
                    stroke="#111111" 
                    strokeWidth="1.0" 
                    strokeLinecap="round" 
                    opacity="0.3"
                  />
                </svg>

                <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] shadow-[inset_1px_1.5px_3px_rgba(0,0,0,0.9)] border-b border-l border-white/40 absolute left-0 z-40" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] shadow-[inset_-1px_1.5px_3px_rgba(0,0,0,0.9)] border-b border-r border-white/40 absolute right-0 z-40" />
              </div>
            ))}
          </div>
          
          <svg className="absolute w-0 h-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="spiralMetal" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#666666" />
                <stop offset="25%" stopColor="#C2C2C2" />
                <stop offset="45%" stopColor="#FFFFFF" />
                <stop offset="70%" stopColor="#9E9E9E" />
                <stop offset="100%" stopColor="#444444" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.section>

      {/* 7. FAQ ACCORDION SECTION */}
      <motion.section 
        id="faqs" 
        animate={triggerAnimationSection === 'faqs' ? { opacity: [0, 1], scale: [0.93, 1], y: [40, 0] } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 overflow-hidden bg-[#FAFAFA] py-24"
      >
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
          <span className="inline-flex items-center rounded-md border border-black/10 bg-[#F4F0EB] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#4A4A4A]">FAQ</span>            
            <h2 className="font-display text-3xl font-bold text-[#1E1E1E] mt-4 tracking-tight">Platform FAQs</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-real-white rounded-xl border border-black/5 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none transition-colors cursor-pointer"
                >
                  <span className="font-display font-bold text-base text-[#1E1E1E]">{faq.question}</span>
                  <HelpCircle className={`w-5 h-5 shrink-0 ml-4 transition-all duration-300 ${activeFaq === index ? "text-[#1E1E1E] rotate-12 scale-110" : "text-[#6E6E73]"}`} />
                </button>

                <AnimatePresence initial={false}>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <div className="pb-5 px-6 border-t border-black/5 pt-4 text-sm text-[#6E6E73] leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 8. FINAL CALL-TO-ACTION */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.93, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 bg-real-white py-24 overflow-hidden text-center max-w-4xl mx-auto px-6"
      >
        <div className="absolute inset-0 bg-[#F4F0EB]/30 rounded-xl border border-[#F4F0EB] -z-10" />

        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1E1E1E] tracking-tight">
            Streamline Academic Literature Tracking
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-4 max-w-md mx-auto leading-relaxed">
            Configure automated inbox polling pipelines, structure metadata extracts, and analyze departmental statistics inside a unified research catalog.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            {isLoggedIn ? (
              <button
                onClick={onGoToConsoleClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#1E1E1E] text-white font-bold text-sm hover:brightness-110 shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Launch Console</span>
                <ArrowRight className="w-4 h-4 text-real-white" />
              </button>
            ) : (
              <button
                onClick={onSignInClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#1E1E1E] text-real-white font-bold text-sm hover:brightness-110 shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Access Console</span>
                <ArrowRight className="w-4 h-4 text-real-white" />
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* 9. MINIMAL FOOTER */}
      <footer className="border-t border-black/5 py-12 max-w-5xl mx-auto px-6 text-sm text-[#6E6E73] relative z-20 bg-real-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1E1E1E] text-real-white flex items-center justify-center font-bold text-xs">
              p
            </div>
            <span className="font-display font-bold text-base text-[#1E1E1E]">promptflow-AI</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#benefits" onClick={(e) => handleNavLinkClick(e, 'benefits')} className="hover:text-black transition-colors font-medium">Benefits</a>
            <a href="#pipeline" onClick={(e) => handleNavLinkClick(e, 'pipeline')} className="hover:text-black transition-colors font-medium">How it works</a>
            <a href="#roles" onClick={(e) => handleNavLinkClick(e, 'roles')} className="hover:text-black transition-colors font-medium">Security</a>
            <a href="#faqs" onClick={(e) => handleNavLinkClick(e, 'faqs')} className="hover:text-black transition-colors font-medium">FAQ</a>
          </div>

          <p className="text-xs text-[#6E6E73] font-medium font-mono">
            &copy; {new Date().getFullYear()} promptFlow-AI. All rights reserved.
          </p>
        </div>
      </footer>
      </main>

    </div>
  );
};
