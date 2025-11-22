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
