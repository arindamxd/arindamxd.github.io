/** Hero “Available for …” cycle — SSR + `available-text.ts` share this list. */
export const AVAILABLE_WORDS = [
    "opportunities",
    "discussion",
    "collaborate",
    "meetups",
    "projects",
] as const;

export type AvailableWord = (typeof AVAILABLE_WORDS)[number];
