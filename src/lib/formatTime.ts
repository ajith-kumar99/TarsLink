/**
 * Formats a Unix timestamp (ms) into a human-readable string:
 * - Today → "2:34 PM"
 * - This year → "Feb 15, 2:34 PM"
 * - Older → "Feb 15 2023, 2:34 PM"
 */
export function formatTime(timestamp: number): string {
    // TODO: Implement smart timestamp logic
    return new Date(timestamp).toLocaleTimeString();
}
