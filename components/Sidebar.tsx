"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Library, FileText, History, Settings, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove("auth_token");
    router.push("/login");
  };

  const navItems = [
    { name: "Search", href: "/", icon: Search },
    { name: "Library", href: "/library", icon: Library },
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "History", href: "/history", icon: History },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-surface-container-lowest text-on-surface shadow-card border border-outline-variant/30 rounded-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <aside 
        className={cn(
          "w-64 h-full bg-surface-container-lowest/80 backdrop-blur-xl border-r border-outline-variant/30 flex flex-col justify-between py-6 shrink-0 fixed md:static inset-y-0 left-0 z-50 shadow-sm transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div>
          <div className="px-8 mb-10 flex items-center justify-between">
            <div>
              <h1 className="font-hanken font-bold text-2xl text-on-surface flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm shadow-md">
                  <Search className="w-4 h-4" />
                </span>
                Insight
              </h1>
              <p className="text-xs text-on-surface-variant mt-1 font-geist tracking-wide uppercase opacity-80">
                AI Research Hub
              </p>
            </div>
            <button className="md:hidden text-outline hover:text-on-surface" onClick={() => setIsOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

        <nav className="flex flex-col gap-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative group",
                  isActive
                    ? "bg-primary-container/20 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                )}
                onClick={() => setIsOpen(false)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(0,88,190,0.5)]" />
                )}
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-outline")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 flex flex-col gap-2">
        <Link 
          href="/settings"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all w-full text-left"
        >
          <Settings className="w-5 h-5 text-outline" />
          Settings
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error-container/50 transition-all w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
      </aside>
    </>
  );
}
