"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, total, pageSize, onPageChange }: PaginationProps) {
  if (total < 10) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  function pageWindow(maxPages: number) {
    const visiblePageCount = Math.min(pageCount, maxPages);
    const firstPage = Math.min(
      Math.max(page - Math.floor(visiblePageCount / 2), 1),
      pageCount - visiblePageCount + 1,
    );
    return {
      visiblePageCount,
      firstPage,
      pages: Array.from({ length: visiblePageCount }, (_, index) => firstPage + index),
    };
  }
  const mobileWindow = pageWindow(3);
  const desktopWindow = pageWindow(5);

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-col gap-3 border-t border-neutral-200/80 pt-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
        Showing <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{start}–{end}</span> of <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{total}</span>
      </p>
      {pageCount > 1 && (
        <>
        <div className="ml-auto flex items-center justify-center gap-1 self-end rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-1 dark:border-neutral-700 dark:bg-neutral-800/60 sm:hidden">
          <Button type="button" variant="ghost" size="icon" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className="h-8 w-8 text-neutral-600 hover:bg-white hover:text-[#1E4F91] focus-visible:ring-[#1E4F91] disabled:cursor-not-allowed disabled:opacity-35 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-[#A9C5EA]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {mobileWindow.pages.map((pageNumber) => <PageButton key={pageNumber} page={pageNumber} currentPage={page} onPageChange={onPageChange} />)}
          <Button type="button" variant="ghost" size="icon" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Next page" className="h-8 w-8 text-neutral-600 hover:bg-white hover:text-[#1E4F91] focus-visible:ring-[#1E4F91] disabled:cursor-not-allowed disabled:opacity-35 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-[#A9C5EA]">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="hidden items-center gap-1 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-1 dark:border-neutral-700 dark:bg-neutral-800/60 sm:flex">
          <Button type="button" variant="ghost" size="icon" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className="h-8 w-8 text-neutral-600 hover:bg-white hover:text-[#1E4F91] focus-visible:ring-[#1E4F91] disabled:cursor-not-allowed disabled:opacity-35 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-[#A9C5EA]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {desktopWindow.firstPage > 1 && <><PageButton page={1} currentPage={page} onPageChange={onPageChange} /><span aria-hidden="true" className="px-0.5 text-xs text-neutral-400">…</span></>}
          {desktopWindow.pages.map((pageNumber) => <PageButton key={pageNumber} page={pageNumber} currentPage={page} onPageChange={onPageChange} />)}
          {desktopWindow.firstPage + desktopWindow.visiblePageCount - 1 < pageCount && <><span aria-hidden="true" className="px-0.5 text-xs text-neutral-400">…</span><PageButton page={pageCount} currentPage={page} onPageChange={onPageChange} /></>}
          <Button type="button" variant="ghost" size="icon" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Next page" className="h-8 w-8 text-neutral-600 hover:bg-white hover:text-[#1E4F91] focus-visible:ring-[#1E4F91] disabled:cursor-not-allowed disabled:opacity-35 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-[#A9C5EA]">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        </>
      )}
    </nav>
  );
}

function PageButton({
  page,
  currentPage,
  onPageChange,
}: {
  page: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const current = page === currentPage;
  return (
    <Button
      type="button"
      variant={current ? "default" : "ghost"}
      size="sm"
      onClick={() => onPageChange(page)}
      aria-label={`Go to page ${page}`}
      aria-current={current ? "page" : undefined}
      className={`h-8 min-w-8 px-2 text-[11px] tabular-nums ${current ? "bg-[#1E4F91] text-white hover:bg-[#163B69]" : "text-neutral-600 hover:bg-white hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"}`}
    >
      {page}
    </Button>
  );
}
