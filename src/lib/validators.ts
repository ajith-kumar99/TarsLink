// validators.ts — Input validation helpers

export function isValidMessage(content: string): boolean {
    return content.trim().length > 0 && content.length <= 2000;
}

export function isValidGroupName(name: string): boolean {
    return name.trim().length >= 1 && name.trim().length <= 50;
}
