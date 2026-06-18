/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Heart, BookOpen, ThumbsUp, Calendar, User, Clock, 
  ChevronRight, ArrowLeft, HeartHandshake, AlertCircle, X, Search,
  Globe, Newspaper, Loader2, ArrowUpRight, HelpCircle, Activity,
  Info, ExternalLink, RefreshCw, BookOpenCheck, ShieldAlert
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BlogPost } from '../types';

interface WikiSearchResult {
  title: string;
  pageid: number;
  snippet: string;
  timestamp: string;
}

interface WikiFullArticle {
  title: string;
  extract: string;
  pageid: number;
  url: string;
}

interface GlobalNewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  date: string;
  readTime: string;
  headline: string;
  snippet: string;
  link: string;
}

export default function HealthBlog() {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<'publications' | 'wikipedia' | 'news'>('publications');

  // Multi-Specialty Publications (Original Tab)
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLikingId, setIsLikingId] = useState<string | null>(null);

  // Wikipedia Clinical Database Search Engine
  const [wikiQuery, setWikiQuery] = useState('Preventative medicine');
  const [wikiResults, setWikiResults] = useState<WikiSearchResult[]>([]);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState('');
  const [wikiSelectedArticle, setWikiSelectedArticle] = useState<WikiFullArticle | null>(null);
  const [wikiLoadingExcerpt, setWikiLoadingExcerpt] = useState(false);

  // External scholarly search gateway query
  const [gatewayQuery, setGatewayQuery] = useState('');

  // Latest Health News & Live Warnings Alerts
  const [newsSearch, setNewsSearch] = useState('');

  const categories = ['All', 'Wellness', 'Nutrition', 'Mental Health'];

  // Curated Medical & Epidemiological News List
  const healthNewsData: GlobalNewsItem[] = [
    {
      id: "news-1",
      title: "Universal mRNA Influenza Vaccine Enters Phase II Human Clinical Testing Trials",
      source: "World Health Organization (WHO)",
      category: "Vaccine Biotech",
      date: "June 14, 2026",
      readTime: "3 min read",
      headline: "Clinical diagnostics indicate strong cellular immune response across all vaccine groups",
      snippet: "In a definitive step towards protecting against seasonal flu variations permanently, researchers have initiated multi-cohort testing of an investigational universal mRNA influenza vaccine candidate. Early outcomes highlight broad antibody binding titers across diverse strain spectrums.",
      link: "https://www.who.int"
    },
    {
      id: "news-2",
      title: "Digital Therapeutics Integration: AI Arterial Screening Secures Regulatory Clears",
      source: "NIH Scientific Review",
      category: "Clinical AI Diagnostics",
      date: "June 12, 2026",
      readTime: "4 min read",
      headline: "AI models accurately map atherosclerosis risk profiles via peripheral arterial waveforms",
      snippet: "New clinical standards approve deep-learning algorithmic analyzers for preventative cardiology. Using state-of-the-art waveforms, the tools identify subclinical microvascular diseases years earlier than visual inspection of cardiac scans.",
      link: "https://pubmed.ncbi.nlm.nih.gov"
    },
    {
      id: "news-3",
      title: "The Gut Flora Microbiome Axis: Chronic Stress Directly Correlated With Bifidobacteria Declines",
      source: "Gastroenterology Journal",
      category: "Neurology & Gut Health",
      date: "June 09, 2026",
      readTime: "5 min read",
      headline: "Clinical study maps specific biome-regulating pathways of neural feedback loops",
      snippet: "A landmark multi-institutional clinical trial has established specific molecular bridges linking psychological stressors to systemic inflammatory markers via mucosal barrier decay. The research reveals targeted therapeutic dietary methods to re-regulate microbiome diversity in patients.",
      link: "https://www.mayoclinic.org"
    },
    {
      id: "news-4",
      title: "Hypertension Pediatric Guidelines Revised: Re-instating Low-Sodium Standards for Pre-Teens",
      source: "Pediatric Science Group",
      category: "Youth Medicine",
      date: "June 05, 2026",
      readTime: "3 min read",
      headline: "Elevated sodium in processed lunches raises early diastolic targets by 8%",
      snippet: "Epidemiological monitoring highlights unexpected spikes in adolescent blood pressure gauges. Updated guidelines strongly urge immediate, severe regulatory controls on high-sodium stabilizers in institutional elementary lunch prep pipelines.",
      link: "https://pubmed.ncbi.nlm.nih.gov"
    },
    {
      id: "news-5",
      title: "New Monoclonal Antibody Receives Expedited Clearance to Counter High LDL Cholesterol Risk",
      source: "Global Cardiology Alliance",
      category: "Cardiologist Research",
      date: "May 28, 2026",
      readTime: "6 min read",
      headline: "Monthly injectable solution safely delivers average LDL drops of 52%",
      snippet: "For adult patients suffering from genetic hypercholesterolemia, a highly anticipated receptor-binding monoclonal therapy has received fast-track regulatory clearance. Clinical outcome dossiers report negligible hepatotoxicity and sustained arterial plaque regression metrics.",
      link: "https://www.mayoclinic.org"
    }
  ];

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    const handleSelectPost = (e: Event) => {
      const customEvent = e as CustomEvent<BlogPost>;
      setSelectedArticle(customEvent.detail);
      setActiveSubTab('publications');
    };
    window.addEventListener('select-blog-post', handleSelectPost);
    return () => window.removeEventListener('select-blog-post', handleSelectPost);
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/blog');
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (e) {
      console.error("Error loading blog posts:", e);
    }
  };

  const handleLike = async (e: React.MouseEvent, artId: string) => {
    e.stopPropagation();
    setIsLikingId(artId);
    try {
      const res = await fetch(`/api/blog/${artId}/like`, { method: 'POST' });
      if (res.ok) {
        setArticles(prev => prev.map(art => {
          if (art.id === artId) {
            return { ...art, likes: art.likes + 1 };
          }
          return art;
        }));
        if (selectedArticle && selectedArticle.id === artId) {
          setSelectedArticle(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        }
      }
    } catch (err) {
      console.error("Error liking blog post:", err);
    } finally {
      setIsLikingId(null);
    }
  };

  // Run Wikipedia Live API search
  const searchWikipedia = async (q: string) => {
    if (!q.trim()) return;
    setWikiLoading(true);
    setWikiError('');
    try {
      // Fetching specifically using CORS-friendly origin=* parameter
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=&format=json&origin=*&srlimit=12`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Database server communication failure.");
      const data = await res.json();
      if (data.query && data.query.search) {
        setWikiResults(data.query.search);
      } else {
        setWikiResults([]);
      }
    } catch (err: any) {
      console.error("Wikipedia search failed:", err);
      setWikiError("Error querying the physical Wikipedia medical database. Ensure internet connectivity is live.");
    } finally {
      setWikiLoading(false);
    }
  };

  // Fetch full article summary content
  const fetchWikipediaArticle = async (title: string) => {
    setWikiLoadingExcerpt(true);
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${encodeURIComponent(title)}&format=json&origin=*`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Request to medical portal failed.");
      const data = await res.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      const pageData = pages[pageId];
      if (pageData && pageId !== "-1") {
        setWikiSelectedArticle({
          title: pageData.title,
          extract: pageData.extract || "No description summary detail was returned by the medical encyclopedia server.",
          pageid: pageData.pageid,
          url: `https://en.wikipedia.org/?curid=${pageData.pageid}`
        });
      } else {
        alert("Unable to gather article content body summary details.");
      }
    } catch (err) {
      console.error("Wikipedia load detail error:", err);
      alert("Error contacting open encyclopedia API servers.");
    } finally {
      setWikiLoadingExcerpt(false);
    }
  };

  // Run scholarly gateway redirect
  const launchScholarlySearch = (engine: 'pubmed' | 'scholar' | 'mayo' | 'who') => {
    const query = gatewayQuery.trim() || wikiQuery.trim() || 'Preventative medicine';
    let targetUrl = '';
    switch (engine) {
      case 'pubmed':
        targetUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`;
        break;
      case 'scholar':
        targetUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
        break;
      case 'mayo':
        targetUrl = `https://www.mayoclinic.org/search/search-results?q=${encodeURIComponent(query)}`;
        break;
      case 'who':
        targetUrl = `https://www.who.int/search?query=${encodeURIComponent(query)}`;
        break;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Filters logic
  const filteredArticles = articles.filter(art => {
    const matchesFilter = filterCategory === 'All' || art.category === filterCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredNews = healthNewsData.filter(news => {
    return news.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
           news.snippet.toLowerCase().includes(newsSearch.toLowerCase()) ||
           news.category.toLowerCase().includes(newsSearch.toLowerCase()) ||
           news.source.toLowerCase().includes(newsSearch.toLowerCase());
  });

  return (
    <div id="health-blog-section" className="space-y-6">
      
      {/* Visual Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Arogyam Health Research & Clinical Library
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access secure knowledge, peer-reviewed clinical articles, real-time medical search databases, and global healthcare bulletins.
          </p>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-100/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/80">
        <div className="flex flex-1 sm:flex-initial gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('publications')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'publications' 
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-xs border border-slate-200/40 dark:border-slate-750' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <BookOpenCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Clinic Publications
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('wikipedia');
              if (wikiResults.length === 0) {
                searchWikipedia('Preventative medicine');
              }
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'wikipedia' 
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-xs border border-slate-200/40 dark:border-slate-750' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-600 dark:text-sky-450" />
            Medical Wiki Search
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('news')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'news' 
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-xs border border-slate-200/40 dark:border-slate-750' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Newspaper className="w-4 h-4 text-amber-600 dark:text-amber-450" />
            Latest News & Alerts
          </button>
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold px-3 py-1 bg-slate-50 dark:bg-slate-950/30 rounded-lg text-center select-none border border-slate-200/30 dark:border-slate-850">
          AROGYAM HEALTH SECURE CONNECT
        </div>
      </div>

      {/* SUB-TAB 1: CLINIC PUBLICATIONS */}
      {activeSubTab === 'publications' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header row with search inside Publications */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-200/40 dark:border-slate-850">
            {/* Category filters */}
            <div className="flex gap-1.5 overflow-x-auto select-none py-1">
              {categories.map(cat => (
                <button
                  id={`blog-category-${cat.toLowerCase().replace(/\s/g, '-')}`}
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer shrink-0 ${filterCategory === cat ? 'bg-teal-600 text-white shadow-3xs' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-750'}`}
                >
                  {cat} {cat === 'All' ? `(${articles.length})` : `(${articles.filter(a => a.category === cat).length})`}
                </button>
              ))}
            </div>

            {/* Search inputs */}
            <div className="relative max-w-xs w-full">
              <input
                id="blog-search-input"
                type="text"
                placeholder="Search publications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8.5 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-705 dark:text-slate-200 placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Articles grid structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
                No health publications matching parameter filters.
              </div>
            ) : (
              filteredArticles.map(art => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-3xs flex flex-col h-full text-left cursor-pointer hover:-translate-y-0.5 transition-all hover:shadow-2xs group"
                >
                  <div className="relative h-44 overflow-hidden shrink-0">
                    <img
                      src={art.image}
                      alt={art.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    <span className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-teal-700 dark:text-teal-400 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase border border-slate-100 dark:border-slate-800">
                      {art.category}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex gap-3 items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {art.date}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {art.readTime}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm leading-tight line-clamp-2 group-hover:text-teal-650 dark:group-hover:text-teal-400 transition-colors">
                        {art.title}
                      </h3>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-normal">
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto text-[10px] text-slate-650 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-teal-600 dark:text-teal-400 text-[10px] font-black shrink-0 border border-slate-200 dark:border-slate-700">
                          {art.author.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold block text-slate-700 dark:text-slate-200 truncate">{art.author}</span>
                          <span className="text-[9px] text-slate-400 truncate block">{art.authorTitle}</span>
                        </div>
                      </div>

                      <button
                        id={`like-post-${art.id}`}
                        onClick={(e) => handleLike(e, art.id)}
                        disabled={isLikingId === art.id}
                        className="flex items-center gap-1.5 px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 text-slate-450 dark:text-slate-500 transition-colors cursor-pointer group/like disabled:opacity-40 font-semibold"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 group-hover/like:scale-110 transition-transform text-slate-400 dark:text-slate-500 fill-transparent group-hover/like:fill-rose-50" />
                        <span>{art.likes}</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: WIKIPEDIA MEDICAL SEARCH ENGINE */}
      {activeSubTab === 'wikipedia' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main search engine panel card */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/20 dark:from-slate-900 dark:to-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-3xs space-y-5 text-left">
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold text-teal-650 dark:text-teal-400 tracking-widest uppercase bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-100 dark:border-teal-900/60 inline-block">
                Open Medical Knowledge Core
              </span>
              <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                Medical & Clinical Triage Database Search
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal max-w-2xl font-normal">
                Query Wikipedia's global encyclopedia servers instantly for articles detailing symptoms, pharmacology formulas, diagnosis paradigms, or physical wellness disciplines.
              </p>
            </div>

            {/* Live Search Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                searchWikipedia(wikiQuery);
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Diabetes Mellitus, Asthma treatments, Dengue Vaccine..."
                  value={wikiQuery}
                  onChange={(e) => setWikiQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-8 py-2.5 bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 shadow-3xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                {wikiQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setWikiQuery('');
                      setWikiResults([]);
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              <button
                type="submit"
                disabled={wikiLoading || !wikiQuery.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40"
              >
                {wikiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Querying Atlas...
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    Query Medical Wiki
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Suggested Medical Searches
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Diabetes', 'Hypertension', 'Cardiology', 'Aspirin', 'Yoga Science', 'Dengue virus', 'Cognitive behavioral therapy'].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setWikiQuery(suggestion);
                      searchWikipedia(suggestion);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-slate-650 dark:text-slate-300 font-bold hover:text-teal-700 dark:hover:text-teal-400 text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-3xs"
                  >
                    🔍 {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search results list display */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-250 uppercase tracking-widest flex items-center gap-1.5 pl-1">
              <Activity className="w-4 h-4 text-teal-600" />
              Encyclopedia Query Results ({wikiResults.length})
            </h4>

            {wikiError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-4 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-455 text-xs">
                <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Database Error Status</p>
                  <p className="text-[11px] font-normal mt-0.5">{wikiError}</p>
                </div>
              </div>
            )}

            {wikiLoading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                <p className="text-xs text-slate-450 font-medium animate-pulse">Contacting medical API registry servers...</p>
              </div>
            ) : wikiResults.length === 0 && !wikiError ? (
              <div className="bg-slate-50 dark:bg-slate-900/40 p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-350 mb-2" />
                No medical articles matching queries have been loaded. Enter a term above to call the live encyclopedia database.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wikiResults.map(res => (
                  <div
                    key={res.pageid}
                    className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-3xs group hover:border-teal-500/45 dark:hover:border-teal-500/45 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs leading-snug group-hover:text-teal-650 dark:group-hover:text-teal-400 transition-colors">
                          {res.title}
                        </h5>
                        <span className="text-[8.5px] font-semibold text-slate-400 font-mono bg-slate-50 dark:bg-slate-850 px-1.5 py-0.2 rounded border border-slate-100 dark:border-slate-750">
                          ID: {res.pageid}
                        </span>
                      </div>
                      
                      {/* Snippet parser - strip html safe or render carefully */}
                      <p 
                        className="text-[11px] text-slate-505 dark:text-slate-400 leading-relaxed font-normal line-clamp-3 italic"
                        dangerouslySetInnerHTML={{ __html: res.snippet + '...' }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                      <span className="text-[8px] font-mono text-slate-400">
                        Modified: {new Date(res.timestamp).toLocaleDateString()}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => fetchWikipediaArticle(res.title)}
                        className="px-3 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900 border border-teal-100 dark:border-teal-900/60 rounded-lg text-[10px] text-teal-700 dark:text-teal-400 font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" /> Read Article Summary
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secure Scholarly External Search Gateways */}
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-850 text-left space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                Scholarly Academic Clinical Gateways (External Search)
              </h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                Looking for peer-reviewed academic literature or professional journals? Type a medical query below and launch immediate search parameters across elite worldwide research grids.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter scholarly keyword (e.g. Cardiovascular genetics, diabetes therapies)..."
                value={gatewayQuery}
                onChange={(e) => setGatewayQuery(e.target.value)}
                className="flex-1 text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 focus:ring-1 focus:ring-teal-500 focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => launchScholarlySearch('pubmed')}
                className="py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-650 rounded-xl text-[10px] font-extrabold text-slate-700 dark:text-slate-350 flex items-center justify-between gap-1 transition-colors cursor-pointer"
              >
                <span>PubMed Central DB</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => launchScholarlySearch('scholar')}
                className="py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-650 rounded-xl text-[10px] font-extrabold text-slate-700 dark:text-slate-355 flex items-center justify-between gap-1 transition-colors cursor-pointer"
              >
                <span>Google Scholar</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => launchScholarlySearch('mayo')}
                className="py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-650 rounded-xl text-[10px] font-extrabold text-slate-700 dark:text-slate-355 flex items-center justify-between gap-1 transition-colors cursor-pointer"
              >
                <span>Mayo Clinic Guides</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => launchScholarlySearch('who')}
                className="py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-650 rounded-xl text-[10px] font-extrabold text-slate-700 dark:text-slate-355 flex items-center justify-between gap-1 transition-colors cursor-pointer"
              >
                <span>WHO Search Engine</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: LATEST NEWS & INDICES */}
      {activeSubTab === 'news' && (
        <div className="space-y-6 text-left animate-fadeIn">
          
          {/* Header segment with live bulletin */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-205 dark:border-slate-850">
            <div>
              <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                Live Epidemic Warning & Health Broadcast Feed
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-normal">
                Chronological news releases concerning preventative health, medical discoveries, vaccines, and global care paradigms.
              </p>
            </div>

            {/* Filter */}
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search latest alerts..."
                value={newsSearch}
                onChange={(e) => setNewsSearch(e.target.value)}
                className="w-full text-xs pl-8.5 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-705 dark:text-slate-200 placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Bulletin Feed */}
          <div className="space-y-4">
            {filteredNews.length === 0 ? (
              <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                No active health bulletins found matching your parameters.
              </div>
            ) : (
              filteredNews.map(news => (
                <div
                  key={news.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200/75 dark:border-slate-800/80 rounded-2xl shadow-3xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="font-extrabold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded border border-teal-100 dark:border-teal-900/60">
                        {news.category}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-500 dark:text-slate-400 font-bold font-mono text-[9px] uppercase">
                        Source: {news.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {news.date}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {news.readTime}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-850 dark:text-slate-100 leading-snug">
                      {news.title}
                    </h4>
                    <p className="text-[10px] font-bold text-teal-650 dark:text-teal-400 italic">
                      "{news.headline}"
                    </p>
                    <p className="text-[11px] text-slate-650 dark:text-slate-400 leading-relaxed font-normal">
                      {news.snippet}
                    </p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <a
                      href={news.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-650 dark:text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      Medical Reference Source <ExternalLink className="w-3 h-3 text-teal-600" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* Reader Immersive Modal for Internal Blog Posts */}
      {selectedArticle && (
        <div id="blog-reader-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-150 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col text-left">
            
            <div className="relative h-56 shrink-0 border-b border-slate-100 dark:border-slate-800">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent animate-fadeIn"></div>
              
              <span className="absolute top-4 left-4 bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border border-teal-500 shadow-sm">
                {selectedArticle.category}
              </span>

              <button
                id="reader-modal-close"
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                <h3 className="font-extrabold text-lg sm:text-xl md:text-2xl tracking-normal leading-tight">
                  {selectedArticle.title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                    By {selectedArticle.author}, {selectedArticle.authorTitle}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-300" />
                    {selectedArticle.date}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-slate-900">
              <div className="markdown-body prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line space-y-4">
                <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-805 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-teal-650" />
                  <span>Peer-reviewed for clinical accuracy.</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Helpful?</span>
                  <button
                    id="reader-like-btn"
                    onClick={(e) => handleLike(e, selectedArticle.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200/50 dark:border-rose-800 text-rose-700 dark:text-rose-450 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{selectedArticle.likes}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Wikipedia Article Reader Live Modal */}
      {wikiSelectedArticle && (
        <div id="wiki-reader-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col text-left">
            
            {/* Header cover segment */}
            <div className="p-6 bg-teal-650 text-white shrink-0 relative">
              <button
                onClick={() => setWikiSelectedArticle(null)}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-1.5 max-w-[90%]">
                <span className="text-[9px] font-extrabold text-teal-105 bg-white/20 px-2 py-0.5 rounded border border-white/25 uppercase tracking-wide inline-block">
                  Wikipedia Med-Database Entry
                </span>
                <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
                  {wikiSelectedArticle.title}
                </h3>
                <p className="text-[10px] text-teal-100 font-medium">
                  Page reference catalog ID: {wikiSelectedArticle.pageid} &bull; Loaded from secure open servers
                </p>
              </div>
            </div>

            {/* Content segment */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350">
              
              {/* Informational Disclaimer Banner */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 p-3.5 rounded-xl flex items-start gap-3 text-blue-805 dark:text-blue-355 text-[11px] leading-relaxed">
                <Info className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">Clinical Information Notice</span>
                  This article is a general medical publication reference loaded live from Wikipedia. It is intended for informative self-education and is **not** a substitute for professional triage diagnosis, advice, or therapy plan.
                </div>
              </div>

              {/* Text Extract Body */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  Scientific Extract & Overview
                </h4>
                <p className="text-xs sm:text-[13px] leading-relaxed font-normal text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {wikiSelectedArticle.extract}
                </p>
              </div>

              {/* Call-to-action buttons */}
              <div className="pt-6 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-slate-400">
                <span className="text-[10px] font-bold text-slate-450 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                  Secure educational service
                </span>

                <div className="flex gap-2 w-full sm:w-auto">
                  <a
                    href={wikiSelectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-extrabold rounded-xl border border-slate-200 dark:border-slate-700 text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Read complete Wikipedia history <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setWikiSelectedArticle(null)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-center cursor-pointer transition-colors"
                  >
                    Done Reading
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Loading overlay for Wiki Extract fetching */}
      {wikiLoadingExcerpt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-55">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            <span className="text-xs text-slate-705 dark:text-slate-200 font-bold">Assembling Medical Extract...</span>
          </div>
        </div>
      )}

    </div>
  );
}
