"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Zap,
  LayoutGrid,
  ArrowLeftRight,
  Wallet,
  Upload,
  LogOut,
  Star,
  User,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface SidebarProps {
  user: SupabaseUser;
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ user, profile, isOpen, onClose }: SidebarProps) {
  const navItems = [
    {
      href: "/marketplace",
      label: "Marketplace",
      icon: LayoutGrid,
    },
    {
      href: "/trades",
      label: "Minhas Trades",
      icon: ArrowLeftRight,
    },
    {
      href: "/wallet",
      label: "Carteira",
      icon: Wallet,
    },
    {
      href: "/upload",
      label: "Anunciar Carta",
      icon: Upload,
    },
  ];

  if (profile?.is_admin) {
    navItems.push({
      href: "/admin",
      label: "Painel Admin",
      icon: ShieldCheck,
    });
  }
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const reputationScore = profile?.reputation_score ?? 0;
  const reputationColor =
    reputationScore >= 75
      ? "text-emerald-400"
      : reputationScore >= 50
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 ease-in-out lg:w-64",
          isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo & Close */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400/30 bg-yellow-400/10">
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
            <span className="font-black text-gradient text-lg">PokéTrade</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted/50"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* User profile section */}
        <div className="border-b border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="relative group">
               <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border/50 overflow-hidden ring-2 ring-transparent group-hover:ring-yellow-400/30 transition-all">
                {profile?.avatar_url ? (
                   <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {profile?.is_admin && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 border-2 border-card">
                  <ShieldCheck className="h-2 w-2 text-black" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">
                {profile?.username ?? user.email?.split("@")[0]}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="h-3 w-3 text-yellow-400" />
                <span className={cn("text-[10px] font-black uppercase tracking-wider", reputationColor)}>
                  Rep: {reputationScore}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={cn(
                  "sidebar-link group relative", 
                  isActive && "active"
                )}
                id={`nav-${item.label.toLowerCase().replace(/ /g, "-")}`}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "group-hover:bg-muted"
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-border/50 p-3 bg-muted/20">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-destructive hover:bg-destructive/10 transition-colors"
            id="logout-btn"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="font-bold">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
