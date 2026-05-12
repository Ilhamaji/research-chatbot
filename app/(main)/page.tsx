"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Send,
  ArrowRight,
  BookOpen,
  Clock,
  Bot,
  Copy,
  BookmarkPlus,
} from "lucide-react";
import { searchArticles, summarize } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Article = {
  title: string;
  url: string;
  abstract: string;
  authors: string[];
  year: string;
  subject: string;
  jenjang: string;
  relevance_score: number | null;
};

type SearchResponse = {
  source: string;
  similarity_score: number;
  articles: Article[];
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          Loading interface...
        </div>
      }
    >
      <ResearchCanvas />
    </Suspense>
  );
}

function ResearchCanvas() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [summaryData, setSummaryData] = useState<{
    url: string;
    summary: string;
  } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      setHasSearched(true);

      // Try loading from local storage cache for an instantaneous recovery experience
      const savedHistory = JSON.parse(
        localStorage.getItem("search_history") || "[]",
      );
      const cachedItem = savedHistory.find((h: any) => h.query === q);
      if (cachedItem && cachedItem.searchData) {
        setSearchData(cachedItem.searchData);
        if (cachedItem.summaryData) {
          setSummaryData(cachedItem.summaryData);
        } else if (cachedItem.searchData.articles?.[0]?.url) {
          // Trigger summary if missing
          setIsSummarizing(true);
          summarize({ url: cachedItem.searchData.articles[0].url })
            .then((sumData) => {
              setSummaryData(sumData);
              // Update cache
              cachedItem.summaryData = sumData;
              localStorage.setItem(
                "search_history",
                JSON.stringify(savedHistory),
              );
            })
            .catch((sumErr) => {
              setSummaryData({
                url: cachedItem.searchData.articles[0].url,
                summary: `⚠️ Tidak dapat membuat ringkasan: ${sumErr.message || "Terjadi kesalahan."}`,
              });
            })
            .finally(() => setIsSummarizing(false));
        }
      } else {
        handleSearch(undefined, q);
      }
    }
  }, [searchParams]);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const searchQuery = overrideQuery || query;
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchData(null);
    setSummaryData(null);

    try {
      const data = await searchArticles(searchQuery);
      setSearchData(data);

      // If we got articles, trigger summary automatically
      if (data.articles && data.articles.length > 0) {
        // Save full canvas state to History cache
        const currentHistory = JSON.parse(
          localStorage.getItem("search_history") || "[]",
        );
        const existingIdx = currentHistory.findIndex(
          (h: any) => h.query === searchQuery,
        );
        let historyId = Date.now().toString();

        const newHistoryItem = {
          id: historyId,
          query: searchQuery,
          timestamp: Date.now(),
          matches: data.articles.length,
          searchData: data,
        };

        let updatedHistory = [];
        if (existingIdx >= 0) {
          historyId = currentHistory[existingIdx].id;
          newHistoryItem.id = historyId;
          // Retain summaryData if present
          if (currentHistory[existingIdx].summaryData) {
            (newHistoryItem as any).summaryData =
              currentHistory[existingIdx].summaryData;
          }
          updatedHistory = [
            newHistoryItem,
            ...currentHistory.filter((_, idx) => idx !== existingIdx),
          ];
        } else {
          updatedHistory = [newHistoryItem, ...currentHistory.slice(0, 49)];
        }
        localStorage.setItem("search_history", JSON.stringify(updatedHistory));

        // If summary data wasn't pre-cached
        if (!(newHistoryItem as any).summaryData) {
          setIsSummarizing(true);
          try {
            const sumData = await summarize({ url: data.articles[0].url });
            setSummaryData(sumData);

            // Append summaryData cache
            const latestHistory = JSON.parse(
              localStorage.getItem("search_history") || "[]",
            );
            const targetIdx = latestHistory.findIndex(
              (h: any) => h.id === historyId,
            );
            if (targetIdx >= 0) {
              latestHistory[targetIdx].summaryData = sumData;
              localStorage.setItem(
                "search_history",
                JSON.stringify(latestHistory),
              );
            }
          } catch (sumErr: any) {
            setSummaryData({
              url: data.articles[0].url,
              summary: `⚠️ Tidak dapat membuat ringkasan: ${sumErr.message || "Terjadi kesalahan pada server."}`,
            });
          } finally {
            setIsSummarizing(false);
          }
        } else {
          setSummaryData((newHistoryItem as any).summaryData);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative w-full overflow-hidden">
      {/* Header */}
      <header className="flex-none pr-8 pl-16 md:pl-8 py-6 border-b border-outline-variant/20 bg-surface/50 backdrop-blur-md flex justify-between items-center z-10">
        <h2 className="typography-headline-sm text-on-surface">
          Research Canvas
        </h2>
        {hasSearched && (
          <div className="flex items-center gap-2 text-on-surface-variant typography-label-sm">
            <Clock className="w-4 h-4" />
            <span>Session Active</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center"
            >
              <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="typography-display-lg text-on-surface mb-4 font-bold">
                What are you researching today?
              </h1>
              <p className="typography-body-lg text-on-surface-variant mb-8 max-w-xl leading-relaxed">
                Enter a topic, question, or keyword. The AI will scan academic
                sources and synthesize a comprehensive overview.
              </p>

              {/* Embed Search Bar natively inside the normal flow to guarantee zero overlapping */}
              <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl group-focus-within:bg-primary/10 transition-colors" />
                <div className="relative bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-full border border-outline-variant/30 overflow-hidden flex items-center pr-2 pl-6 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all text-left">
                  <Search className="w-6 h-6 text-outline shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for academic papers, concepts, or methodologies..."
                    className="w-full py-5 px-4 bg-transparent outline-none text-on-surface typography-body-lg placeholder:text-outline"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className={cn(
                      "p-3 rounded-full transition-all shrink-0",
                      query.trim()
                        ? "bg-primary text-white hover:scale-105 shadow-md shadow-primary/30"
                        : "bg-surface-container text-outline",
                    )}
                  >
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="max-w-6xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24"
            >
              {/* Left Column: Related Articles */}
              <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="typography-headline-sm text-on-surface">
                    Related Articles
                  </h3>
                  {searchData && (
                    <span className="px-3 py-1 bg-primary-container/20 text-primary typography-label-sm rounded-full">
                      {searchData.articles.length} Matches
                    </span>
                  )}
                </div>

                {isSearching ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-40 bg-surface-container animate-pulse rounded-xl"
                      />
                    ))}
                  </div>
                ) : (
                  searchData?.articles.map((article, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx}
                      className="bg-surface-container-lowest rounded-xl p-5 shadow-card border border-outline-variant/30 hover:shadow-lg transition-all"
                    >
                      <div className="flex gap-2 mb-3">
                        <span className="px-2 py-1 bg-surface-container text-on-surface-variant typography-label-sm rounded-md flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {article.subject || "General"}
                        </span>
                        <span className="px-2 py-1 bg-surface-container text-on-surface-variant typography-label-sm rounded-md">
                          {article.jenjang || "N/A"}
                        </span>
                      </div>
                      <h4 className="font-hanken font-semibold text-lg text-on-surface leading-tight mb-2">
                        {article.title || "Untitled Document"}
                      </h4>
                      <p className="typography-body-md text-on-surface-variant line-clamp-3 mb-4 text-sm">
                        {article.abstract || "No abstract available."}
                      </p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="typography-label-sm text-outline">
                          {article.year} • {article.authors?.[0] || "Unknown"}
                        </span>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const current = JSON.parse(
                                localStorage.getItem("saved_articles") || "[]",
                              );
                              if (
                                !current.find((a: any) => a.url === article.url)
                              ) {
                                localStorage.setItem(
                                  "saved_articles",
                                  JSON.stringify([
                                    {
                                      ...article,
                                      id: article.url,
                                      savedAt: Date.now(),
                                    },
                                    ...current,
                                  ]),
                                );
                                alert("Article saved to library!");
                              } else {
                                alert("Article already in library!");
                              }
                            }}
                            className="p-1.5 text-outline hover:text-primary transition-colors"
                            title="Save to Library"
                          >
                            <BookmarkPlus className="w-5 h-5" />
                          </motion.button>
                          {article.url && (
                            <motion.a
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              href={article.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-primary hover:text-primary-container transition-colors"
                              title="Read Original"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </motion.a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Right Column: AI Summary */}
              <div className="col-span-1 lg:col-span-8">
                <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-outline-variant/30 p-8 h-full min-h-[500px]">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="typography-headline-sm text-on-surface">
                          AI Research Summary
                        </h3>
                        <p className="typography-label-md text-outline">
                          Synthesized from search results
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline typography-label-sm">
                          Copy
                        </span>
                      </button>
                      <button className="px-4 py-2 bg-primary text-white hover:bg-primary-container rounded-lg transition-colors flex items-center gap-2 font-medium text-sm">
                        <BookmarkPlus className="w-4 h-4" />
                        Save to Notes
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-lg prose-slate max-w-none font-inter text-on-surface">
                    {isSummarizing ? (
                      <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-surface-container rounded w-3/4"></div>
                        <div className="h-4 bg-surface-container rounded w-full"></div>
                        <div className="h-4 bg-surface-container rounded w-5/6"></div>
                        <div className="h-4 bg-surface-container rounded w-full"></div>
                        <div className="h-4 bg-surface-container rounded w-2/3"></div>
                      </div>
                    ) : summaryData ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {summaryData.summary}
                        </p>
                      </motion.div>
                    ) : (
                      <p className="text-outline italic">
                        No summary generated yet. Searching for articles...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Search Bar Bottom */}
      {hasSearched && (
        <div className="absolute left-0 right-0 p-4 md:p-8 bottom-0 z-20 transition-all duration-500 bg-gradient-to-t from-background via-background/80 to-transparent pt-12 pointer-events-none">
          <div className="pointer-events-auto max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl group-focus-within:bg-primary/10 transition-colors" />
              <div className="relative bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-full border border-outline-variant/30 overflow-hidden flex items-center pr-2 pl-6 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search className="w-6 h-6 text-outline shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for academic papers, concepts, or methodologies..."
                  className="w-full py-5 px-4 bg-transparent outline-none text-on-surface typography-body-lg placeholder:text-outline"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className={cn(
                    "p-3 rounded-full transition-all shrink-0",
                    query.trim()
                      ? "bg-primary text-white hover:scale-105 shadow-md shadow-primary/30"
                      : "bg-surface-container text-outline",
                  )}
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
