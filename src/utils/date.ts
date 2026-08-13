export function formatDate(date: Date, month: 'short' | 'long'): string {
    return date.toLocaleDateString('en-US', {
        month: month,
        day: 'numeric',
        year: 'numeric',
    })
}

export function formatDateByYear(date: Date | '-'): string {
    if (date === '-') return 'Present'
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
    })
}

/** Whole years from the earliest `start` to today (used by intro badge + experiences count). */
export function yearsOfExperience(entries: readonly { start: string }[]): number {
    if (entries.length === 0) return 0;
    const start = new Date(
        entries.reduce((earliest, exp) =>
            new Date(exp.start) < new Date(earliest.start) ? exp : earliest,
        ).start,
    );
    const today = new Date();
    let years = today.getFullYear() - start.getFullYear();
    if (
        today.getMonth() < start.getMonth() ||
        (today.getMonth() === start.getMonth() && today.getDate() < start.getDate())
    ) {
        years--;
    }
    return Math.max(0, years);
}
