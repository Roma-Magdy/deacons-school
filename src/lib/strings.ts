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

  admin: {
    homeLink: "إدارة الحسابات",
    homeHint: "ضيف أطفال وخدّام، أو استوردهم كلهم من إكسل",
    backHome: "← الرئيسية",
    backToUsers: "← كل الحسابات",
    loading: "ثواني...",

    users: {
      title: "الحسابات",
      add: "+ إضافة حساب",
      import: "استيراد من إكسل",
      searchPlaceholder: "دوّر بالاسم أو الموبايل",
      allRoles: "كل الأنواع",
      allGrades: "كل الصفوف",
      search: "بحث",
      count: (shown: number, total: number) =>
        shown < total ? `عرض ${arabicNumber(shown)} من ${arabicNumber(total)}` : `${arabicNumber(total)} حساب`,
      empty: "مفيش حسابات بالشكل ده",
      inactive: "موقوف",
      locked: "مقفول مؤقتًا",
    },

    form: {
      name: "الاسم بالكامل",
      nameHintKid: "الاسم الأول والتاني على الأقل (بيظهر كده في الترتيب)",
      phone: "رقم الموبايل",
      accountType: "نوع الحساب",
      gender: "النوع",
      male: "ذكر",
      female: "أنثى",
      maleKid: "ولد",
      femaleKid: "بنت",
      grade: "الصف",
      password: "كلمة السر",
      passwordHint: "سيبها فاضية وهتتعمل لوحدها",
      create: "إضافة",
      creating: "ثواني...",
      save: "حفظ التعديلات",
      saving: "ثواني...",
      saved: "اتحفظ ✅",
      choose: "اختار...",
    },

    roles: {
      kid: "طفل",
      servant: "خادم",
      branch_leader: "مسؤول فرع",
      admin: "مدير",
    } as Record<Role, string>,

    created: {
      title: "اتضاف الحساب ✅",
      note: "كلمة السر دي بتظهر مرة واحدة بس، ابعتها لصاحبها دلوقتي.",
      another: "إضافة حساب تاني",
    },

    credentials: {
      name: "الاسم",
      phone: "الموبايل",
      password: "كلمة السر",
      copyAll: "نسخ الكل",
      copied: "اتنسخ ✅",
      download: "تحميل ملف (Excel)",
    },

    edit: {
      title: "تعديل الحساب",
      resetTitle: "كلمة سر جديدة",
      resetHint: "بتفك القفل لو الحساب مقفول. سيب الخانة فاضية وهتتعمل كلمة سر لوحدها.",
      reset: "غيّر كلمة السر",
      resetDone: "كلمة السر الجديدة (بتظهر مرة واحدة):",
      statusTitle: "حالة الحساب",
      activeNow: "الحساب شغال",
      inactiveNow: "الحساب موقوف ومش هيقدر يدخل",
      deactivate: "إيقاف الحساب",
      activate: "تشغيل الحساب",
      notFound: "الحساب ده مش موجود",
    },

    errors: {
      generic: "حصلت مشكلة، جرّب تاني",
      phoneTaken: (name: string) => `الرقم ده مسجّل قبل كده باسم ${name}`,
      shortPassword: "كلمة السر لازم تكون ٦ حروف أو أرقام على الأقل",
      ownRole: "مينفعش تغيّر نوع حسابك أنت",
      ownDeactivate: "مينفعش توقف حسابك أنت",
      badRole: "نوع الحساب مش مظبوط",
    },

    import: {
      title: "استيراد من إكسل",
      intro: "انسخ الأعمدة من إكسل (أو ملف CSV) والصقها هنا. يفضّل أول سطر يكون عناوين الأعمدة.",
      kindLabel: "هتستورد",
      kindKid: "أطفال",
      kindServant: "خدّام",
      exampleKid: "الاسم، الموبايل، الصف، النوع (ولد/بنت)",
      exampleServant: "الاسم، الموبايل، النوع (ذكر/أنثى)",
      pasteLabel: "الصق البيانات هنا",
      fileLabel: "أو اختار ملف CSV",
      check: "افحص البيانات",
      checking: "بفحص...",
      nothing: "مفيش بيانات تتفحص",
      readyCount: (n: number) => `${arabicNumber(n)} جاهز للإضافة`,
      problemCount: (n: number) => `${arabicNumber(n)} فيهم مشكلة (مش هيتضافوا)`,
      line: (n: number) => `سطر ${arabicNumber(n)}`,
      importNow: (n: number) => `أضف ${arabicNumber(n)} حساب`,
      importing: (done: number, total: number) => `بضيف... ${arabicNumber(done)} من ${arabicNumber(total)}`,
      doneTitle: "خلصنا",
      doneCount: (n: number) => `اتضاف ${arabicNumber(n)} حساب`,
      skippedTitle: "ما اتضافوش",
      note: "كلمات السر دي بتظهر مرة واحدة بس. حمّل الملف أو انسخها دلوقتي قبل ما تقفل الصفحة.",
      again: "استيراد تاني",
      existsAs: (name: string) => `الرقم ده مسجّل قبل كده باسم ${name}`,
      raceSkipped: "الرقم ده اتسجّل في نفس الوقت",
    },
  },
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
