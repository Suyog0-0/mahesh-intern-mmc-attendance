"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const visiblePageCount = Math.min(pageCount, 5);
  const firstPage = Math.min(
    Math.max(page - Math.floor(visiblePageCount / 2), 1),
    pageCount - visiblePageCount + 1,
  );
  const pages = Array.from({ length: visiblePageCount }, (_, index) => firstPage + index);

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-col gap-3 border-t border-neutral-200/80 pt-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
        Showing <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{start}–{end}</span> of <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{total}</span>
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1 self-end rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-1 dark:border-neutral-700 dark:bg-neutral-800/60">
          <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-white hover:text-[#1E4F91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] disabled:cursor-not-allowed disabled:opacity-35 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-[#A9C5EA]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {firstPage > 1 && <><PageButton page={1} currentPage={page} onPageChange={onPageChange} /><span aria-hidden="true" className="px-0.5 text-xs text-neutral-400">…</span></>}
          {pages.map((pageNumber) => <PageButton key={pageNumber} page={pageNumber} currentPage={page} onPageChange={onPageChange} />)}
          {firstPage + visiblePageCount - 1 < pageCount && <><span aria-hidden="true" className="px-0.5 text-xs text-neutral-400">…</span><PageButton page={pageCount} currentPage={page} onPageChange={onPageChange} /></>}
          <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Next page" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-white hover:text-[#1E4F91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] disabled:cursor-not-allowed disabled:opacity-35 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-[#A9C5EA]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
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
    <button
      type="button"
      onClick={() => onPageChange(page)}
      aria-label={`Go to page ${page}`}
      aria-current={current ? "page" : undefined}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4F91] ${current ? "bg-[#1E4F91] text-white shadow-sm" : "text-neutral-600 hover:bg-white hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"}`}
    >
      {page}
    </button>
  );
}
