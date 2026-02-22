"use client";

import Image from "next/image";
import type { Message } from "@/types/message";
import { formatTimestamp } from "@/lib/formatTimestamp";

// ─── WhatsApp-style double-tick SVG ──────────────────────────────────────────
function MessageTicks({ isRead }: { isRead: boolean }) {
    const color = isRead ? "#60a5fa" : "#6b7280"; // blue-400 : gray-500
    return (
        <svg
            width="16"
            height="11"
            viewBox="0 0 16 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0"
            aria-label={isRead ? "Read" : "Sent"}
        >
            {/* First check mark */}
            <path
                d="M1 5.5L4 8.5L9.5 2"
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Second check mark (offset right) */}
            <path
                d="M5.5 5.5L8.5 8.5L14 2"
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

interface MessageBubbleProps {
    message: Message;
    isMine: boolean;
    showAvatar?: boolean;
    senderName?: string;
    senderAvatar?: string;
    /** For sent messages: whether the other side has read this message */
    isRead?: boolean;
}

export default function MessageBubble({
    message,
    isMine,
    showAvatar,
    senderName,
    senderAvatar,
    isRead = false,
}: MessageBubbleProps) {
    return (
        <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} group`}>
            {/* Avatar placeholder (keeps layout aligned) */}
            <div className="w-7 h-7 flex-shrink-0">
                {showAvatar && senderAvatar ? (
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-700">
                        <Image
                            src={senderAvatar}
                            alt={senderName ?? "User"}
                            width={28}
                            height={28}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    </div>
                ) : null}
            </div>

            {/* Bubble + meta */}
            <div className={`flex flex-col max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
                {senderName && !isMine && (
                    <span className="text-xs text-gray-500 mb-1 ml-1">{senderName}</span>
                )}

                <div
                    className={`
                        px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                        ${isMine
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-gray-800 text-gray-100 rounded-bl-sm"
                        }
                    `}
                >
                    {message.content}
                </div>

                {/* Timestamp + read tick row */}
                <div className={`flex items-center gap-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-xs text-gray-600">
                        {formatTimestamp(message.createdAt)}
                    </span>
                    {/* Ticks only on sent messages */}
                    {isMine && <MessageTicks isRead={isRead} />}
                </div>
            </div>
        </div>
    );
}
