const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// UTC and by hand: the same text at build time and in every reader's browser, whatever their locale.
export function formatDate(iso: string): string {
    const date = new Date(iso);
    return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export const isoDay = (iso: string): string => new Date(iso).toISOString().slice(0, 10);
