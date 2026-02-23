"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useIsOnline } from "@/hooks/useIsOnline";

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function UserRowSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-2/3" />
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/3" />
            </div>
        </div>
    );
}

// ─── Inline error banner ──────────────────────────────────────────────────────
function InlineError({ message, onRetry, onDismiss }: { message: string; onRetry?: () => void; onDismiss: () => void }) {
    return (
        <div className="flex items-center justify-between gap-2 mx-4 my-2 px-3 py-2 bg-red-900/30 border border-red-800/40 rounded-xl">
            <p className="text-xs text-red-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {message}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {onRetry && (
                    <button onClick={onRetry} className="text-[10px] font-semibold text-red-300 hover:text-white bg-red-800/40 hover:bg-red-700/60 px-2 py-0.5 rounded transition-colors">
                        Retry
                    </button>
                )}
                <button onClick={onDismiss} className="text-red-500 hover:text-red-300 transition-colors" aria-label="Dismiss">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ─── UserRow — isolated so useIsOnline hook can run per-user ──────────────────
function UserRow({
    user,
    isStarting,
    onSelect,
}: {
    user: { id: unknown; name: string; imageUrl: string; lastSeen: number };
    isStarting: boolean;
    onSelect: () => void;
}) {
    const online = useIsOnline(user.lastSeen);

    return (
        <button
            onClick={onSelect}
            disabled={isStarting}
            className="
                w-full flex items-center gap-3 px-4 py-3 text-left
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                disabled:opacity-60 disabled:cursor-wait
            "
        >
            <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <Image src={user.imageUrl} alt={user.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                </div>
                {online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className={`text-xs ${online ? "text-emerald-400" : "text-gray-500"}`}>
                    {online ? "Online" : "Offline"}
                </p>
            </div>

            {isStarting && (
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
        </button>
    );
}

export default function UserList() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastFailedId, setLastFailedId] = useState<string | null>(null);

    const users = useQuery(api.users.listUsersExceptMe);
    const getOrCreate = useMutation(api.conversations.getOrCreateConversation);

    const filtered = users?.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase().trim())
    );

    const handleSelectUser = async (userId: string) => {
        try {
            setError(null);
            setLoadingId(userId);
            const convId = await getOrCreate({
                otherUserId: userId as Id<"users">,
            });
            router.push(`/chat/${convId}`);
        } catch (err) {
            console.error("Failed to create conversation:", err);
            setError("Couldn't start conversation. Try again.");
            setLastFailedId(userId);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search input */}
            <div className="px-3 py-2">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search people…"
                        className="
                            w-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                            rounded-xl pl-9 pr-4 py-2 outline-none
                            focus:ring-1 focus:ring-indigo-500 transition-all
                        "
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Label */}
            <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                People
            </p>

            {/* Inline error */}
            {error && (
                <InlineError
                    message={error}
                    onRetry={lastFailedId ? () => handleSelectUser(lastFailedId) : undefined}
                    onDismiss={() => { setError(null); setLastFailedId(null); }}
                />
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {/* Loading skeletons */}
                {users === undefined && (
                    <>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <UserRowSkeleton key={i} />
                        ))}
                    </>
                )}

                {/* No results */}
                {filtered !== undefined && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-36 text-center px-6">
                        <div className="w-12 h-12 rounded-full bg-gray-200/50 dark:bg-gray-800/50 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-sm">
                            {search ? `No users matching "${search}"` : "No other users yet"}
                        </p>
                        {search && (
                            <button onClick={() => setSearch("")} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors">
                                Clear search
                            </button>
                        )}
                    </div>
                )}

                {filtered?.map((user) => (
                    <UserRow
                        key={user.id as string}
                        user={user as { id: unknown; name: string; imageUrl: string; lastSeen: number }}
                        isStarting={loadingId === (user.id as string)}
                        onSelect={() => handleSelectUser(user.id as string)}
                    />
                ))}
            </div>
        </div>
    );
}
