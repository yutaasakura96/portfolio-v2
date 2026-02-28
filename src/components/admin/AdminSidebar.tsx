"use client";

import { UnreadBadge } from "@/components/admin/UnreadBadge";
import { cn } from "@/lib/utils";
import {
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
  { href: "/admin/skills", label: "Skills", icon: Sparkles },
  { href: "/admin/experience", label: "Experience", icon: Briefcase },
  { href: "/admin/education", label: "Education", icon: GraduationCap },
  { href: "/admin/certifications", label: "Certifications", icon: Award },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="text-lg font-bold text-gray-900">
          Portfolio Admin
        </Link>
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
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.badge}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          View Public Site ↗
        </Link>
      </div>
    </aside>
  );
}
