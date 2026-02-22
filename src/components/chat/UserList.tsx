"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function UserRowSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-800 rounded animate-pulse w-2/3" />
                <div className="h-2 bg-gray-800 rounded animate-pulse w-1/3" />
            </div>
        </div>
    );
}

export default function UserList() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // ── Step 4: fetch users from Convex ──────────────────────────────────────
    const users = useQuery(api.users.listUsersExceptMe);
    const getOrCreate = useMutation(api.conversations.getOrCreateConversation);

    // ── Step 5: client-side search filter ────────────────────────────────────
    const filtered = users?.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase().trim())
    );

    // ── Step 6: start conversation ────────────────────────────────────────────
    const handleSelectUser = async (userId: string) => {
        try {
            setLoadingId(userId);
            const convId = await getOrCreate({
                otherUserId: userId as Id<"users">,
            });
            router.push(`/chat/${convId}`);
        } catch (err) {
            console.error("Failed to create conversation:", err);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search input */}
            <div className="px-3 py-2">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search people…"
                        className="
                            w-full bg-gray-800 text-sm text-gray-100 placeholder-gray-500
                            rounded-xl pl-9 pr-4 py-2 outline-none
                            focus:ring-1 focus:ring-indigo-500 transition-all
                        "
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Label */}
            <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                People
            </p>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {/* Loading */}
                {users === undefined && (
                    <>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <UserRowSkeleton key={i} />
                        ))}
                    </>
                )}

                {/* No results after search */}
                {filtered !== undefined && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-36 text-center px-6">
                        <p className="text-gray-400 text-sm">
                            {search ? `No users matching "${search}"` : "No other users yet"}
                        </p>
                    </div>
                )}

                {/* User rows */}
                {filtered?.map((user) => {
                    const isStarting = loadingId === user.id;
                    return (
                        <button
                            key={user.id as string}
                            onClick={() => handleSelectUser(user.id as string)}
                            disabled={isStarting}
                            className="
                                w-full flex items-center gap-3 px-4 py-3 text-left
                                hover:bg-gray-800 transition-colors
                                disabled:opacity-60 disabled:cursor-wait
                            "
                        >
                            {/* Avatar + online dot */}
                            <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                                    <Image
                                        src={user.imageUrl}
                                        alt={user.name}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                </div>
                                {user.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-900" />
                                )}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <p className={`text-xs ${user.isOnline ? "text-emerald-400" : "text-gray-500"}`}>
                                    {user.isOnline ? "Online" : "Offline"}
                                </p>
                            </div>

                            {/* Starting spinner */}
                            {isStarting && (
                                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
