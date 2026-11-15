// Shared by the add-stars screen and its server actions, so the screen and the server always agree.

/** Every award starts at 1 star; a servant can change it. */
export const DEFAULT_AMOUNT = 1;
/** Just a guard against typos like 500 instead of 5. */
export const MAX_AMOUNT = 50;
/** A whole grade fits in one award; this only stops absurd requests. */
export const MAX_KIDS_PER_AWARD = 150;
export const MAX_NOTE_LENGTH = 200;
