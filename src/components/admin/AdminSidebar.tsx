"use client";

import { UnreadBadge } from "@/components/admin/UnreadBadge";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  Award,
  Briefcase,
  FileText,
  FolderKanban,
  GraduationCap,
  Home,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/hero", label: "Hero", icon: Home },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/messages", label: "Messages", icon: Mail, badge: <UnreadBadge /> },
  { href: "/admin/about", label: "About", icon: User },
  { href: "/admin/skills", label: "Skills", icon: Sparkles },
  { href: "/admin/experience", label: "Experience", icon: Briefcase },
  { href: "/admin/education", label: "Education", icon: GraduationCap },
  { href: "/admin/certifications", label: "Certifications", icon: Award },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/import", label: "Import / Export", icon: ArrowUpDown },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-64 bg-background border-r border-border flex flex-col",
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200",
        "md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-6 border-b border-border flex items-center justify-between">
        <Link href="/admin" className="text-lg font-bold text-foreground">
          Portfolio Admin
        </Link>
        <button
          className="md:hidden p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.badge}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          target="_blank"
          prefetch={false}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          View Public Site ↗
        </Link>
      </div>
    </aside>
  );
}
