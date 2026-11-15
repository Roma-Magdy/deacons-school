export type KidItem = {
  id: number;
  name: string;
  grade: number;
  total: number; // lifetime stars
  emoji: string | null;
  imageUrl: string | null;
};

export type ReasonItem = { id: number; name: string; isCompetition: boolean };
export type BranchItem = { id: number; name: string };

/** One "give stars" action as it appears in the recent list (a batch to several kids is one entry). */
export type RecentGroup = {
  ids: number[];
  kids: string[];
  reason: string;
  branch: string | null;
  amount: number;
  when: string;
};
