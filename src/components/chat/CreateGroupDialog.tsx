"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function CreateGroupDialog({ open, onClose }: CreateGroupDialogProps) {
    const router = useRouter();
    const [groupName, setGroupName] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const users = useQuery(api.users.listUsersExceptMe);
    const createGroup = useMutation(api.conversations.createGroupConversation);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setGroupName("");
            setSelectedIds(new Set());
            setSearch("");
            setCreating(false);
            setError(null);
        }
    }, [open]);

    const filtered = users?.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase().trim())
    );

    const toggleUser = (userId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const handleCreate = async () => {
        setError(null);
        const name = groupName.trim();
        if (!name) {
            setError("Please enter a group name");
            return;
        }
        if (selectedIds.size < 1) {
            setError("Select at least 1 member");
            return;
        }

        try {
            setCreating(true);
            const convId = await createGroup({
                name,
                memberIds: [...selectedIds] as Id<"users">[],
            });
            onClose();
            router.push(`/chat/${convId}`);
        } catch (err) {
            console.error("Failed to create group:", err);
            setError("Failed to create group. Try again.");
        } finally {
            setCreating(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Group</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Group Name */}
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group name…"
                        autoFocus
                        className="
                            w-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                            rounded-xl px-4 py-2.5 outline-none mb-3
                            focus:ring-1 focus:ring-indigo-500 transition-all
                        "
                    />

                    {/* Search users */}
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
                    </div>

                    {/* Selected count */}
                    {selectedIds.size > 0 && (
                        <p className="text-xs text-indigo-400 mt-2">
                            {selectedIds.size} member{selectedIds.size > 1 ? "s" : ""} selected
                        </p>
                    )}
                </div>

                {/* User list */}
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                    {users === undefined && (
                        <div className="space-y-1 px-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5">
                                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2" />
                                </div>
                            ))}
                        </div>
                    )}

                    {filtered !== undefined && filtered.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-8">
                            {search ? `No users matching "${search}"` : "No users found"}
                        </p>
                    )}

                    {filtered?.map((user) => {
                        const userId = user.id as string;
                        const isSelected = selectedIds.has(userId);
                        return (
                            <button
                                key={userId}
                                onClick={() => toggleUser(userId)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors
                                    ${isSelected ? "bg-indigo-600/15" : "hover:bg-gray-100 dark:hover:bg-gray-800"}
                                `}
                            >
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                    <Image src={user.imageUrl} alt={user.name} width={36} height={36} className="w-full h-full object-cover" unoptimized />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{user.name}</span>

                                {/* Checkbox */}
                                <div className={`
                                    w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                    ${isSelected
                                        ? "bg-indigo-600 border-indigo-600"
                                        : "border-gray-300 dark:border-gray-600"
                                    }
                                `}>
                                    {isSelected && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800">
                    {/* Inline error */}
                    {error && (
                        <div className="flex items-center gap-1.5 mb-3 px-3 py-2 bg-red-900/30 border border-red-800/40 rounded-xl">
                            <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="
                            w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                            bg-indigo-600 hover:bg-indigo-500 text-white
                            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600
                            flex items-center justify-center gap-2
                        "
                    >
                        {creating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creating…
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Create Group ({selectedIds.size} members)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
