"use client";

import { useState, useRef, type KeyboardEvent } from "react";

interface ChatInputProps {
    onSend: (content: string) => void;
    recipientName?: string;
}

export default function ChatInput({ onSend, recipientName }: ChatInputProps) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setValue("");
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Send on Enter (without Shift)
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        // Auto-resize, cap at ~5 lines
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    };

    return (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
            <div className="flex items-end gap-3 bg-gray-800 rounded-2xl px-4 py-2 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                {/* Auto-resizing textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    placeholder={recipientName ? `Message ${recipientName}…` : "Type a message…"}
                    rows={1}
                    className="
            flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500
            resize-none outline-none overflow-hidden leading-relaxed py-1
            max-h-[120px]
          "
                />

                {/* Send button */}
                <button
                    onClick={handleSend}
                    disabled={!value.trim()}
                    aria-label="Send message"
                    className="
            flex-shrink-0 w-8 h-8 flex items-center justify-center
            rounded-full transition-all
            bg-indigo-600 hover:bg-indigo-500 text-white
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-indigo-600
          "
                >
                    <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>
            </div>

            <p className="text-xs text-gray-600 mt-1.5 ml-1">
                Press <kbd className="font-mono bg-gray-800 px-1 rounded">Enter</kbd> to send,{" "}
                <kbd className="font-mono bg-gray-800 px-1 rounded">Shift+Enter</kbd> for new line
            </p>
        </div>
    );
}
