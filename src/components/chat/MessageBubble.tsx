"use client";

import Image from "next/image";
import type { Message } from "@/types/message";
import { formatTimestamp } from "@/lib/formatTimestamp";

interface MessageBubbleProps {
    message: Message;
    isMine: boolean;
    showAvatar?: boolean;
    senderName?: string;
    senderAvatar?: string;
}

export default function MessageBubble({
    message,
    isMine,
    showAvatar,
    senderName,
    senderAvatar,
}: MessageBubbleProps) {
    return (
        <div
            className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} group`}
        >
            {/* Sender avatar (left side, only for received messages) */}
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

            {/* Bubble */}
            <div className={`flex flex-col max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
                {/* Sender name (only in group conversations, for received messages) */}
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

                {/* Timestamp — visible on hover */}
                <span className="text-xs text-gray-600 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatTimestamp(message.createdAt)}
                </span>
            </div>
        </div>
    );
}
