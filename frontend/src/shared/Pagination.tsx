import React, { useMemo } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

type Props = {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (p: number) => void;
    window?: number;
    compact?: boolean;
    className?: string;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const Pagination: React.FC<Props> = ({
    page,
    perPage,
    total,
    onPageChange,
    window = 1,
    compact = true,
    className = "",
}) => {
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const pages = useMemo(() => {
        const p = clamp(page, 1, totalPages);
        const start = Math.max(1, p - window);
        const end = Math.min(totalPages, p + window);
        const arr: (number | "...")[] = [];

        if (start > 1) {
            arr.push(1);
            if (start > 2) arr.push("...");
        }

        for (let i = start; i <= end; i++) arr.push(i);
        if (end < totalPages) {
            if (end < totalPages - 1) arr.push("...");
            arr.push(totalPages);
        }

        return arr;
    }, [page, totalPages, window]);

    if (totalPages <= 1) return null;

    const go = (p: number) => onPageChange(clamp(p, 1, totalPages));

    const baseBtn =
        "px-3 h-9 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors";
    const numBtn =
        "min-w-[36px] px-3 h-9 rounded-xl border text-sm transition-colors";
    const current =
        "bg-blue-600/25 text-blue-300 border-blue-500/40";
    const normal =
        "bg-slate-800/70 text-slate-200 border-slate-700 hover:bg-slate-700";
    const disabled =
        "opacity-50 pointer-events-none";

    return (
        <div className={`w-full flex items-center justify-between ${className}`}>
            <div className="text-sm text-slate-400">
                Página <span className="text-slate-200">{page}</span> de{" "}
                <span className="text-slate-200">{totalPages}</span> ·{" "}
                <span className="text-slate-200">{total}</span> registros
            </div>

            <div className="flex items-center gap-2">
                <button
                    className={`${baseBtn} ${page === 1 ? disabled : ""}`}
                    onClick={() => go(1)}
                    title="Primera"
                    aria-label="Primera página"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                    className={`${baseBtn} ${page === 1 ? disabled : ""}`}
                    onClick={() => go(page - 1)}
                    title="Anterior"
                    aria-label="Página anterior"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="hidden xs:flex items-center gap-2">
                    {pages.map((p, idx) =>
                        p === "..." ? (
                            <span key={`dots-${idx}`} className="px-2 text-slate-500">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                className={`${numBtn} ${p === page ? current : normal}`}
                                onClick={() => go(p)}
                                aria-current={p === page ? "page" : undefined}
                                aria-label={`Página ${p}`}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                {compact && (
                    <div className="xs:hidden text-slate-300 text-sm">
                        {page}/{totalPages}
                    </div>
                )}

                <button
                    className={`${baseBtn} ${page === totalPages ? disabled : ""}`}
                    onClick={() => go(page + 1)}
                    title="Siguiente"
                    aria-label="Página siguiente"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button
                    className={`${baseBtn} ${page === totalPages ? disabled : ""}`}
                    onClick={() => go(totalPages)}
                    title="Última"
                    aria-label="Última página"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
