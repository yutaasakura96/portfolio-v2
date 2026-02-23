"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProjectCard } from "./ProjectCard";

interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  techTags: string[];
  thumbnailImage: string;
  featured: boolean;
  displayOrder: number;
  startDate: Date | null;
  endDate: Date | null;
  liveUrl: string | null;
  repoUrl: string | null;
}

interface ProjectBrowserProps {
  projects: Project[];
}

type SortOption = "order" | "newest" | "oldest" | "title";

export function ProjectBrowser({ projects }: ProjectBrowserProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read initial state from URL
  const initialSearch = searchParams.get("q") ?? "";
  const initialTag = searchParams.get("tag") ?? "";
  const initialSort = (searchParams.get("sort") as SortOption) ?? "order";

  const [search, setSearch] = useState(initialSearch);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [sort, setSort] = useState<SortOption>(initialSort);

  // Extract all unique tags across projects
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((p) => p.techTags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [projects]);

  // Filter and sort
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.techTags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter((p) => p.techTags.includes(selectedTag));
    }

    // Sort
    switch (sort) {
      case "newest":
        result.sort(
          (a, b) =>
            (b.startDate ? new Date(b.startDate).getTime() : 0) -
            (a.startDate ? new Date(a.startDate).getTime() : 0)
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            (a.startDate ? new Date(a.startDate).getTime() : 0) -
            (b.startDate ? new Date(b.startDate).getTime() : 0)
        );
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "order":
      default:
        result.sort((a, b) => a.displayOrder - b.displayOrder);
        break;
    }

    return result;
  }, [projects, search, selectedTag, sort]);

  // Sync state to URL for shareable links
  function updateUrl(newSearch: string, newTag: string, newSort: SortOption) {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("q", newSearch.trim());
    if (newTag) params.set("tag", newTag);
    if (newSort !== "order") params.set("sort", newSort);
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
    setSort("order");
    router.replace(pathname, { scroll: false });
  }

  const hasActiveFilters = search.trim() || selectedTag || sort !== "order";

  return (
    <div>
      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="rounded-lg border border-gray-200 text-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="order">Default Order</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">A → Z</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
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
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {filteredProjects.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " found" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found matching your criteria.</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-gray-600 underline hover:text-gray-900"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
