"use client";

import { useLocale } from "@/hooks/use-locale";
import { ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BlogPostCard } from "./BlogPostCard";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featuredImage: string | null;
  tags: string[];
  readTime: number | null;
  publishedAt: Date | null;
  titleJa?: string | null;
  excerptJa?: string | null;
}

interface BlogBrowserProps {
  posts: BlogPost[];
}

type SortOption = "newest" | "oldest" | "title";

export function BlogBrowser({ posts }: BlogBrowserProps) {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialSearch = searchParams.get("q") ?? "";
  const initialTag = searchParams.get("tag") ?? "";
  const initialSort = (searchParams.get("sort") as SortOption) ?? "newest";

  const [search, setSearch] = useState(initialSearch);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [sort, setSort] = useState<SortOption>(initialSort);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedTag) {
      result = result.filter((p) => p.tags.includes(selectedTag));
    }

    switch (sort) {
      case "oldest":
        result.sort(
          (a, b) =>
            (a.publishedAt ? new Date(a.publishedAt).getTime() : 0) -
            (b.publishedAt ? new Date(b.publishedAt).getTime() : 0)
        );
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) -
            (a.publishedAt ? new Date(a.publishedAt).getTime() : 0)
        );
        break;
    }

    return result;
  }, [posts, search, selectedTag, sort]);

  function updateUrl(newSearch: string, newTag: string, newSort: SortOption) {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("q", newSearch.trim());
    if (newTag) params.set("tag", newTag);
    if (newSort !== "newest") params.set("sort", newSort);
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    updateUrl(value, selectedTag, sort);
  }

  function handleTagChange(tag: string) {
    const newTag = tag === selectedTag ? "" : tag;
    setSelectedTag(newTag);
    updateUrl(search, newTag, sort);
  }

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    updateUrl(search, selectedTag, newSort);
  }

  function clearFilters() {
    setSearch("");
    setSelectedTag("");
    setSort("newest");
    router.replace(pathname, { scroll: false });
  }

  const hasActiveFilters = search.trim() || selectedTag || sort !== "newest";

  return (
    <div>
      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={ui("searchPosts", locale)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="rounded-lg border border-input text-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="newest">{ui("newestFirst", locale)}</option>
            <option value="oldest">{ui("oldestFirst", locale)}</option>
            <option value="title">{ui("aToZ", locale)}</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-input hover:bg-accent transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            {ui("clear", locale)}
          </button>
        )}
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                selectedTag === tag
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent pressable"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {filteredPosts.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredPosts.length}{" "}
            {locale === "ja"
              ? `${ui("posts", locale)}${hasActiveFilters ? ui("postsFound", locale) : ""}`
              : `post${filteredPosts.length !== 1 ? "s" : ""}${hasActiveFilters ? ` ${ui("postsFound", locale)}` : ""}`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, i) => (
              <BlogPostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{ui("noPostsFound", locale)}</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-muted-foreground underline hover:text-foreground"
          >
            {ui("clearFilters", locale)}
          </button>
        </div>
      )}
    </div>
  );
}
