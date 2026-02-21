/**
 * Merges class names conditionally.
 * Will be upgraded to use clsx + tailwind-merge once dependencies are installed.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}
