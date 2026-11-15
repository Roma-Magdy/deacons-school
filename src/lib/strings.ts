// Every piece of text the app shows lives here, in light Egyptian Arabic,
// so any sentence can be changed in one place without touching the screens.

export type Gender = "male" | "female";
export type Role = "kid" | "servant" | "branch_leader" | "admin";

export const SCHOOL_NAME = "مدرسة القديس أثناسيوس الرسولي للشمامسة";

export const text = {
  appShortName: "مدرسة الشمامسة",
  appDescription: "نجوم ومسابقات مدرسة الشمامسة",

  login: {
    pageTitle: "تسجيل الدخول",
    subtitle: "ادخل برقم الموبايل وكلمة السر",
    phoneLabel: "رقم الموبايل",
    passwordLabel: "كلمة السر",
    submit: "دخول",
    submitting: "ثواني...",
    errors: {
      invalidPhone: "رقم الموبايل مش مظبوط، اكتبه تاني",
      missingPassword: "اكتب كلمة السر",
      wrongCredentials: "رقم الموبايل أو كلمة السر مش مظبوطين",
      locked: "حاولت كتير غلط. استنى شوية وجرّب تاني، أو كلّم أي خادم.",
    },
  },

  home: {
    pageTitle: "الرئيسية",
    loading: "ثواني...",
    logout: "خروج",
    kidSoon: "قريب: هتشوف ترتيبك وسط زمايلك، وتغيّر شكل النجوم!",
    staffSoon: "شاشة إضافة النجوم جاية قريب 🌟",
    nextShape: (starsLeft: number, shapeName: string) =>
      starsLeft === 1 ? `فاضل نجمة واحدة وتفتح "${shapeName}"` : `فاضل ${arabicNumber(starsLeft)} نجوم وتفتح "${shapeName}"`,
  },

  starsPrefix: "معاك",
} as const;

const GRADE_LABELS: Record<number, string> = {
  3: "تالتة ابتدائي",
  4: "رابعة ابتدائي",
  5: "خامسة ابتدائي",
  6: "سادسة ابتدائي",
};

export function gradeLabel(grade: number | null): string {
  return grade ? (GRADE_LABELS[grade] ?? "") : "";
}

/** First word of the full name, used in greetings. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** The greeting shown at the top of the home page. Falls back to a plain "أهلاً" if gender isn't set yet. */
export function greeting(user: { role: Role; gender: Gender | null; fullName: string }): string {
  const name = firstName(user.fullName);

  if (user.role === "kid") {
    if (user.gender === "male") return `أهلاً شماسنا الشاطر ${name}!`;
    if (user.gender === "female") return `أهلاً تاسونتنا الشاطرة ${name}!`;
    return `أهلاً ${name}!`;
  }

  // servants, branch leaders and admins
  if (user.gender === "male") return `أهلاً يا باسون ${name}`;
  if (user.gender === "female") return `أهلاً يا تاسوني ${name}`;
  return `أهلاً ${name}`;
}

export function roleLabel(role: Role, gender: Gender | null): string {
  const f = gender === "female";
  switch (role) {
    case "kid":
      return f ? "تاسوني صغيرة" : "شماس صغير";
    case "servant":
      return f ? "خادمة" : "خادم";
    case "branch_leader":
      return f ? "مسؤولة فرع" : "مسؤول فرع";
    case "admin":
      return f ? "مديرة" : "مدير";
  }
}

/** Numbers shown to people use Arabic-Indic digits (٤٧). */
export function arabicNumber(n: number): string {
  return n.toLocaleString("ar-EG");
}
