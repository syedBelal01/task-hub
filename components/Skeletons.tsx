"use client";

import React from "react";

export function TaskCardSkeleton({ hasManageButton = false }: { hasManageButton?: boolean }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 animate-pulse">
                <div className="min-w-0 flex-1 space-y-3">
                    {/* Title skeleton */}
                    <div className="h-5 w-3/4 rounded bg-slate-200"></div>

                    {/* Description skeleton line 1 */}
                    <div className="h-4 w-full rounded bg-slate-200"></div>
                    {/* Description skeleton line 2 */}
                    <div className="h-4 w-5/6 rounded bg-slate-200"></div>

                    {/* Badges skeleton row */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <div className="h-4 w-24 rounded bg-slate-200"></div>
                        <div className="h-4 w-16 rounded bg-slate-200"></div>
                        <div className="h-4 w-20 rounded bg-slate-200"></div>
                    </div>
                </div>

                {/* Manage button skeleton */}
                {hasManageButton && (
                    <div className="shrink-0 h-8 w-20 rounded-lg bg-slate-200"></div>
                )}
            </div>
        </div>
    );
}

export function SectionSkeleton({ title, count = 3 }: { title: string; count?: number }) {
    return (
        <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">{title}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: count }).map((_, i) => (
                    <TaskCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

export function MobileSectionSkeleton({ title, count = 2 }: { title: string; count?: number }) {
    return (
        <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
            <div className="space-y-3">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-start justify-between border-b border-slate-100 bg-white p-4 last:border-0 rounded-lg shadow-sm">
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-2/3 rounded bg-slate-200"></div>
                            <div className="h-3 w-1/3 rounded bg-slate-200"></div>
                            <div className="h-3 w-1/2 rounded bg-slate-200"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
