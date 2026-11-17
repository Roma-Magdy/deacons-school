/**
 * One bcrypt cost for every password hash, including the dummy hash the login compares against for unknown phone numbers.
 * If they differed, a wrong password would take visibly longer or shorter depending on whether the number has an account.
 * Cost 10 keeps importing a few hundred accounts fast enough for a serverless function.
 */
export const BCRYPT_COST = 10;
