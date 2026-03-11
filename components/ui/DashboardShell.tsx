"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, Zap } from "lucide-react";
import type { Profile } from "@/types/database";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import Link from "next/link";

interface DashboardShellProps {
  children: React.ReactNode;
  user: SupabaseUser;
  profile: Profile | null;
}

export function DashboardShell({ children, user, profile }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Component */}
      <Sidebar 
        user={user} 
        profile={profile} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:ml-64 transition-all duration-300">
        {/* Top Header - Mobile Only or YouTube Style */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted lg:hidden"
            >
              <Menu className="h-6 w-6 text-muted-foreground" />
            </button>
            <div className="hidden lg:flex items-center gap-2">
               <Zap className="h-5 w-5 text-yellow-400" />
               <span className="font-black text-gradient">Dashboard</span>
            </div>
            {/* Mobile Logo */}
            <Link href="/" className="lg:hidden flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="font-black text-gradient">PokéTrade</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Can add search or notifications here like YouTube */}
            <div className="h-8 w-8 rounded-full bg-muted border border-border/50 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User" className="h-full w-full object-cover" />
                ) : (
                    <span className="text-xs font-bold">{profile?.username?.[0] || 'U'}</span>
                )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
