"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Search, Trash2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

type HistoryItem = {
  id: string;
  query: string;
  timestamp: number;
  matches: number;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("search_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("search_history");
    setHistory([]);
  };

  const removeHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter((h) => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("search_history", JSON.stringify(newHistory));
  };

  // Note: To re-search, we could pass it via query params to the canvas, but since the canvas uses local state,
  // we will just redirect to canvas and let the user type. Or ideally, we'd use URL state in the canvas.
  const handleReSearch = (query: string) => {
    // For now, redirect to home. In a robust app, home would read ?q=query
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="typography-headline-md text-on-surface mb-2">Search History</h2>
            <p className="typography-body-md text-on-surface-variant">
              Review your past research queries.
            </p>
          </div>
          {history.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearHistory}
              className="px-4 py-2 bg-surface-container text-error hover:bg-error/10 rounded-lg transition-colors flex items-center gap-2 font-medium typography-label-md shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </motion.button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-outline" />
            </div>
            <h3 className="typography-headline-sm text-on-surface mb-2">No History Yet</h3>
            <p className="text-on-surface-variant max-w-md">
              Your search history will appear here once you start querying the Research Canvas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {history.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id}
                  onClick={() => handleReSearch(item.query)}
                  className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-container/20 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="typography-label-md text-on-surface font-semibold text-base mb-1">
                        {item.query}
                      </h4>
                      <div className="flex items-center gap-3 typography-label-sm text-on-surface-variant">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span>{item.matches} matches found</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => removeHistoryItem(item.id, e)}
                      className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 text-primary">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
