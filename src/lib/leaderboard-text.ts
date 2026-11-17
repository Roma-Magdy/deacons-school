// Text for the leaderboards (kept in its own file so it can be dropped in without touching strings.ts).
import { arabicNumber } from "./strings";

export const leaderboardText = {
  title: "الترتيب",
  back: "← الرئيسية",
  homeLink: "الترتيب",
  homeHint: "شوف مين الأول في كل صف",
  gradeLabel: "الصف",
  allStars: "كل النجوم",
  allBranches: "كل الفروع",
  noTerm: "مفيش ترم شغال دلوقتي، فمفيش ترتيب. كلّم المدير يفعل ترم.",
  empty: "لسه مفيش نجوم هنا. أول ما حد ياخد نجوم هتلاقيه في الترتيب.",
  yourPlace: "ترتيبك",
  noStarsYet: "لسه ما خدتش نجوم هنا، ادخل المنافسة!",
  place: (n: number) => arabicNumber(n),
  stars: (n: number) => arabicNumber(n),
  homeRank: (place: number) => `ترتيبك في الفصل: ${arabicNumber(place)}`,
  homeNoRank: "لسه مفيش ترتيب. أول ما تاخد نجوم هتظهر هنا!",
  homeButton: "شوف الترتيب",
  tie: "مشترك",
};
