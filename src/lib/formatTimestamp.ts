/**
 * formatTimestamp — smart message timestamp formatting.
 *
 * Rules:
 *   - Same day (today)  → "2:34 PM"
 *   - Same year         → "Feb 15, 2:34 PM"
 *   - Different year    → "Feb 15 2024, 2:34 PM"
 */
export function formatTimestamp(createdAt: number): string {
    const date = new Date(createdAt);
    const now = new Date();

    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

    const isSameYear = date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    if (isToday) {
        return timeStr; // e.g. "2:34 PM"
    }

    const monthDay = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    if (isSameYear) {
        return `${monthDay}, ${timeStr}`; // e.g. "Feb 15, 2:34 PM"
    }

    return `${monthDay} ${date.getFullYear()}, ${timeStr}`; // e.g. "Feb 15 2024, 2:34 PM"
}
