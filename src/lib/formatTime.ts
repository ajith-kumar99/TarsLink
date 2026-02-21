/**
 * Formats a Unix timestamp (ms) into a human-readable string:
 * - Today       → "2:34 PM"
 * - This year   → "Feb 15, 2:34 PM"
 * - Older       → "Feb 15 2023, 2:34 PM"
 */
export function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const isThisYear = date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    if (isToday) return timeStr;

    const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(isThisYear ? {} : { year: "numeric" }),
    });

    return `${dateStr}, ${timeStr}`;
}
