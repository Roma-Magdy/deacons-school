// Every piece of text the app shows lives here, in light Egyptian Arabic,
// so any sentence can be changed in one place without touching the screens.

export type Gender = "male" | "female";
export type Role = "kid" | "servant" | "admin";

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
      locked: "حاولت كتير غلط. استنى شوية وجرّب تاني، أو كلّم الخادم بتاعك",
    },
  },

  home: {
    pageTitle: "الرئيسية",
    loading: "ثواني...",
    logout: "خروج",
    chartTitle: "نجومي",
    kidSoon: "قريب: هتشوف ترتيبك وسط زمايلك!",
    changeShape: "غيّر شكل نجومك",
    changeShapeHint: "",
    history: "نجومي جاتلي منين؟",
    nextShape: (starsLeft: number, shapeName: string) =>
      starsLeft === 1 ? `فاضل نجمة واحدة وتفتح "${shapeName}"` : `فاضل ${arabicNumber(starsLeft)} نجمة وتفتح "${shapeName}"`,
  },

  starsPrefix: "معاك",

  shapes: {
    title: "اختار شكل نجومك",
    back: "← الرئيسية",
    intro: "اختار الشكل اللي يمثّل نجومك. كل ما تجمع نجوم أكتر بتفتح أشكال جديدة، وبتفضل بتاعتك على طول.",
    current: "الشكل بتاعك",
    choose: "اضغط واختاره",
    starsToGo: (n: number) => (n === 1 ? "فاضل نجمة واحدة" : `فاضل ${arabicNumber(n)} نجمة`),
    done: (name: string) => `اخترت «${name}»`,
    errors: {
      locked: "الشكل ده لسه مقفول، اجمع نجوم أكتر",
      generic: "حصلت مشكلة، جرّب تاني",
    },
  },

  history: {
    title: "نجومي جاتلي منين؟",
    back: "← الرئيسية",
    empty: "لسه ما جاتلكش نجوم. أول ما تاخد نجمة هتلاقيها هنا.",
    summary: (total: number, count: number) => `${starsCount(total)} في ${arabicNumber(count)} مرة`,
  },

  stars: {
    pageTitle: "إضافة نجوم",
    homeLink: "إضافة نجوم",
    homeHint: "اختار الأطفال والسبب وادي نجوم",
    noTerm: "مفيش ترم شغال دلوقتي، كلّم المدير يفعّل ترم.",
    gradeAll: "الكل",
    search: "دور بالاسم",
    selectAll: "اختار كل اللي ظاهرين",
    clear: "إلغاء الاختيار",
    noKids: "مفيش أطفال بالبيانات دي ",
    nobodySelected: "لسه ما اخترتش حد",
    reason: "السبب",
    amount: "عدد النجوم",
    plus: "زود",
    minus: "قلل",
    branch: "الفرع (اختياري)",
    generalBranch: "عام (من غير فرع)",
    addNote: "+ ملاحظة",
    note: "ملاحظة (اختياري)",
    give: "ادي النجوم",
    giving: "ثواني...",
    undo: "تراجع",
    undone: "اتلغت",
    recentTitle: "اخر اللي اديته",
    recentHint: "كل اللي اديته في الترم ده. تقدر تلغي أي حاجة منهم.",
    recentEmpty: "لسه ما اديتش نجوم",
    recentSearch: "دور في اللي اديته (اسم طفل أو سبب)",
    recentSearching: "بدور...",
    recentNoMatch: "مفيش حاجة بالشكل ده",
    recentMore: "عرض المزيد",
    showNames: (n: number) => `عرض الأسماء (${arabicNumber(n)})`,
    hideNames: "إخفاء الأسماء",
    matched: (names: string) => `مطابق: ${names}`,
    undoOne: "إلغاء",
    undoAll: "إلغاء الكل",
    confirmUndoAll: (n: number) => (n === 1 ? "متأكد إنك عايز تلغي النجوم دي؟" : `متأكد؟ هتلغي النجوم لـ ${kidsCount(n)}.`),
    confirmUndoOne: (name: string) => `تلغي نجوم ${name}؟`,
    yesUndo: "أيوه، إلغي",
    noKeep: "لأ",
    selected: (n: number) => `اخترت ${kidsCount(n)}`,
    done: (amount: number, who: string) => `اتضاف ${starsCount(amount)} لـ ${who}`,
    andMore: (n: number) => `و${arabicNumber(n)} كمان`,
    errors: {
      noKids: "اختار طفل واحد على الأقل",
      badKids: "في طفل مش موجود، حدث الصفحة وجرب تاني",
      tooMany: "عدد الأطفال كبير أوي، قسّمهم على مرتين",
      badAmount: (max: number) => `عدد النجوم لازم يبقى من ١ لـ ${arabicNumber(max)}`,
      badReason: "السبب مش مظبوط",
      badBranch: "الفرع مش موجود",
      noteTooLong: "الملاحظة طويلة، اختصرها",
      cantUndo: "مفيش حاجة اتلغت. ممكن تكون اتلغت قبل كده، أو من ترم قديم، أو مش بتاعتك",
      generic: "حصلت مشكلة، جرّب تاني",
    },
  },

  admin: {
    homeLink: "إدارة الحسابات",
    homeHint: "ضيف أطفال أو خدام، أو استوردهم كلهم من إكسل",
    backHome: "← الرئيسية",
    backToUsers: "← كل الحسابات",
    loading: "ثواني...",

    users: {
      title: "الحسابات",
      add: "+ إضافة حساب",
      import: "استيراد من إكسل",
      promote: "ترقية السنة الدراسية",
      archive: (n: number) => (n > 0 ? `الأرشيف (${arabicNumber(n)})` : "الأرشيف"),
      searchPlaceholder: "دور بالاسم أو الموبايل",
      tabAll: "الكل",
      tabStaff: "خدام",
      count: (shown: number, total: number) =>
        shown < total ? `عرض ${arabicNumber(shown)} من ${arabicNumber(total)}` : `${arabicNumber(total)} حساب`,
      empty: "مفيش حسابات بالشكل ده",
      inactive: "موقوف",
      locked: "مقفول مؤقتًا",
      selectAll: "اختار كل اللي ظاهرين",
      clear: "إلغاء الاختيار",
      selected: (n: number) => `اخترت ${arabicNumber(n)}`,
      selectRow: (name: string) => `اختار ${name}`,
      bulk: {
        moveTo: "انقلهم لصف",
        chooseGrade: "اختار الصف",
        onlyKids: "النقل لصف تاني للأطفال بس. شيل الخدام من الاختيار.",
        deactivate: "إيقاف",
        activate: "تشغيل",
        yes: "أيوه، كمّل",
        no: "لأ",
        working: "ثواني...",
        confirmMove: (n: number, grade: string) => `تنقل ${arabicNumber(n)} حساب إلى ${grade}؟`,
        confirmDeactivate: (n: number) => `توقف ${arabicNumber(n)} حساب؟ مش هيقدروا يدخلوا.`,
        confirmActivate: (n: number) => `تشغّل ${arabicNumber(n)} حساب؟`,
        moved: (n: number, grade: string) => `اتنقل ${arabicNumber(n)} إلى ${grade}`,
        deactivated: (n: number) => `اتوقف ${arabicNumber(n)} حساب`,
        activated: (n: number) => `اتشغّل ${arabicNumber(n)} حساب`,
        skippedSelf: "حسابك أنت ما اتوقفش",
      },
    },

    promote: {
      title: "ترقية السنة الدراسية",
      intro:
        "بتتعمل مرة واحدة في السنة. كل طفل بيتنقل صف واحد بس، والسادسة بيتحولوا لخريجين في الأرشيف. النجوم بتفضل زي ما هي.",
      yearLabel: "سنة التخرج (اسم الدفعة في الأرشيف)",
      previewTitle: "اللي هيحصل",
      moveLine: (from: string, to: string, n: number) => `${from} ← ${to}: ${arabicNumber(n)}`,
      graduateTo: (year: number) => `خريجين ${arabicNumber(year, true)}`,
      staysTitle: "عايز طفل يفضل في صفه؟",
      staysHint: "علّم عليه وهيفضل مكانه، ومش هيتنقل ولا هيتأرشف.",
      staysCount: (n: number) => `${arabicNumber(n)} هيفضلوا مكانهم`,
      showKids: "اعرض الأطفال",
      hideKids: "اخفي الأطفال",
      nothing: "مفيش أطفال تتنقل",
      recentWarning: (when: string) => `اتعملت ترقية قبل كده في ${when}. اتأكد إنك مش بتكررها بالغلط.`,
      confirm: (n: number) => `رقّي ${arabicNumber(n)} طفل`,
      confirmAsk: (n: number, year: number) =>
        `هتنقل ${arabicNumber(n)} طفل صف لفوق، والسادسة هيتأرشفوا باسم خريجين ${arabicNumber(year, true)}. متأكد؟`,
      confirmAskNoGraduates: (n: number) => `هتنقل ${arabicNumber(n)} طفل صف لفوق. متأكد؟`,
      confirmYes: "أيوه، نفّذ الترقية",
      confirmNo: "لأ، ارجع",
      working: "بنفّذ...",
      doneTitle: "الترقية اتعملت",
      doneLine: (promoted: number, graduated: number) =>
        graduated > 0
          ? `اتنقل ${arabicNumber(promoted)} صف لفوق، واتأرشف ${arabicNumber(graduated)} خريج.`
          : `اتنقل ${arabicNumber(promoted)} صف لفوق.`,
      undo: "تراجع عن الترقية",
      undoing: "برجّع...",
      undone: (restored: number) => `الترقية اتلغت ورجع ${arabicNumber(restored)} طفل لصفه.`,
      undoSkipped: (n: number) => `${arabicNumber(n)} حساب اتغيّر بعد الترقية فسيبناه زي ما هو.`,
      lastTitle: "آخر ترقية",
      lastLine: (when: string, n: number, year: number) =>
        `${when} · ${arabicNumber(n)} طفل · دفعة ${arabicNumber(year, true)}`,
      undoHint: "التراجع بيرجّع كل طفل لصفه القديم ويطلّع الخريجين من الأرشيف.",
      errors: {
        badYear: "سنة التخرج مش مظبوطة",
        tooSoon: "اتعملت ترقية من شوية. لو ده بالغلط استخدم «تراجع عن الترقية».",
        nothing: "مفيش أطفال تتنقل",
        cantUndo: "التراجع متاح لآخر ترقية بس، وماينفعش تتراجع مرتين",
        generic: "حصلت مشكلة، جرب تاني",
      },
    },

    archive: {
      title: "أرشيف الخريجين",
      back: "← الأرشيف",
      intro: "الخريجين متوقفين ومخفيين من القوائم، ونجومهم محفوظة. صدّر البيانات الأول لو هتمسح.",
      empty: "مفيش خريجين لسه. بيظهروا هنا بعد أول ترقية للسنة الدراسية.",
      batch: (year: number) => `دفعة ${arabicNumber(year, true)}`,
      tabCount: (year: number, n: number) => `${arabicNumber(year, true)} (${arabicNumber(n)})`,
      searchPlaceholder: "دور بالاسم أو الموبايل",
      noMatch: "مفيش خريج بالاسم ده",
      selectAll: "اختار كل اللي ظاهرين",
      clear: "إلغاء الاختيار",
      selected: (n: number) => `اخترت ${arabicNumber(n)}`,
      stars: (n: number) => `${arabicNumber(n)} نجمة`,
      exportTitle: "تصدير",
      exportHint: "من غير اختيار هيتصدر كل الدفعة، ومع الاختيار هيتصدر المختارين بس.",
      exportList: "تصدير القايمة (Excel)",
      exportHistory: "تصدير سجل النجوم (Excel)",
      exporting: "بجهز الملف...",
      exported: "الملف اتحمّل",
      restore: "رجعهم للحسابات الشغالة",
      restoring: "برجّع...",
      restored: (n: number) => `رجع ${arabicNumber(n)} للحسابات الشغالة`,
      deleteTitle: "مسح نهائي",
      deleteHint: "بيمسح الحسابات المختارة وكل نجومها نهائيًا. لازم تصدّر سجل النجوم للمختارين الأول.",
      deleteNeedsExport: "صدّر سجل النجوم للمختارين الأول عشان زرار المسح يشتغل.",
      delete: (n: number) => `امسح ${arabicNumber(n)} نهائيًا`,
      deleteAsk: (n: number, stars: number) =>
        `متأكد إنك عايز تمسح ${arabicNumber(n)} خريج و${arabicNumber(stars)} نجمة بتاعتهم؟ مش هينفع ترجعهم.`,
      deleteYes: "أيوه، امسح نهائيًا",
      deleteNo: "لأ، سيبهم",
      deleting: "بمسح...",
      deleted: (n: number) => `اتمسح ${arabicNumber(n)} خريج`,
      errors: {
        none: "اختار حد الأول",
        generic: "حصلت مشكلة، جرب تاني",
      },
      csv: {
        name: "الاسم",
        phone: "الموبايل",
        gender: "النوع",
        grade: "الصف الأخير",
        year: "سنة التخرج",
        totalStars: "إجمالي النجوم",
        date: "التاريخ",
        reason: "السبب",
        branch: "الفرع",
        amount: "عدد النجوم",
        term: "الترم",
        note: "ملاحظة",
        male: "ولد",
        female: "بنت",
      },
    },

    shapes: {
      homeLink: "الأشكال",
      homeHint: "ضيف أو شيل  أو غير أشكال النقط",
      title: "الأشكال",
      intro: "الأشكال اللي الأطفال بيختاروا منها. الشكل ممكن يبقى إيموجي أو صورة. الشكل اللي نجومه صفر مفتوح للكل.",
      addTitle: "إضافة شكل",
      name: "اسم الشكل",
      namePlaceholder: "مثلًا: كأس",
      emoji: "الإيموجي",
      emojiHint: "الصق إيموجي، وتقدر تضيف صورة بعدين",
      stars: "النجوم المطلوبة",
      starsHint: "صفر = مفتوح للكل",
      imageOptional: "صورة (اختياري)",
      imageHint: "بتتصغّر لوحدها. مش بنقبل SVG.",
      add: "إضافة الشكل",
      adding: "ثواني...",
      free: "مفتوح للكل",
      needs: (n: number) => (n === 1 ? "بنجمة واحدة" : `بـ ${arabicNumber(n)} نجمة`),
      wearing: (n: number) => (n === 0 ? "محدش بيستخدمه" : `مستخدمينه ${arabicNumber(n)}`),
      hiddenBadge: "مخفي",
      edit: "تعديل",
      save: "حفظ",
      saving: "ثواني...",
      saved: "اتحفظ",
      cancel: "إلغاء",
      hide: "إخفاء",
      show: "إظهار",
      addImage: "إضافة صورة",
      changeImage: "تغيير الصورة",
      removeImage: "شيل الصورة",
      delete: "مسح",
      deleteAsk: (name: string) => `متأكد إنك عايز تمسح «${name}»؟`,
      deleteYes: "أيوه، امسح",
      deleteNo: "لأ",
      deleting: "بمسح...",
      errors: {
        name: "اكتب اسم الشكل",
        emoji: "الإيموجي مش مظبوط",
        stars: "اكتب عدد النجوم (رقم من صفر لفوق)",
        needsPicture: "الشكل لازم يبقى له إيموجي أو صورة",
        imageType: "الصورة لازم تكون PNG أو JPG أو WebP",
        imageSize: "الصورة كبيرة، اختار واحدة أصغر",
        lastFree: "لازم يفضل شكل ببلاش ظاهر للأطفال",
        inUse: "فيه أطفال مستخدمينه أو فاتحينه، ما ينفعش يتمسح. اخفيه بدل كده",
        notFound: "الشكل ده مش موجود",
        generic: "حصلت مشكلة، جرب تاني",
      },
    },

    terms: {
      homeLink: "الترمات",
      homeHint: "ابدأ ترم جديد أو غير الترم الشغال",
      title: "الترمات",
      intro: "النجوم بتتسجل على الترم الشغال. ترم واحد بس يبقى شغال في نفس الوقت.",
      addTitle: "إضافة ترم",
      name: "اسم الترم",
      namePlaceholder: "مثلًا: الترم التاني",
      start: "من",
      end: "لحد",
      add: "إضافة الترم",
      adding: "ثواني...",
      empty: "مفيش ترمات لسه. ضيف أول ترم.",
      current: "شغال دلوقتي",
      noActive: "مفيش ترم شغال، ومحدش هيقدر يدي نجوم. فعّل ترم.",
      awards: (n: number) => (n === 0 ? "من غير نجوم" : `${starsCount(n)} اتسجلت`),
      activate: "فعّل الترم",
      activating: "ثواني...",
      activateAsk: (name: string, current: string | null) =>
        current ? `تفعّل «${name}» وتقفل «${current}»؟ النجوم الجاية هتتسجل على «${name}».` : `تفعّل «${name}»؟`,
      edit: "تعديل",
      cancel: "إلغاء",
      save: "حفظ",
      saving: "ثواني...",
      saved: "اتحفظ",
      delete: "مسح",
      deleteAsk: (name: string) => `متأكد إنك عايز تمسح «${name}»؟`,
      deleteYes: "أيوه، امسح",
      deleteNo: "لأ",
      deleting: "بمسح...",
      deleteHint: "الترم اللي ليه نجوم ما ينفعش يتمسح",
      yes: "أيوه، فعّله",
      no: "لأ",
      errors: {
        name: "اكتب اسم الترم",
        dates: "اختار تاريخ البداية والنهاية",
        order: "تاريخ النهاية لازم يبقى بعد البداية",
        notFound: "الترم ده مش موجود",
        hasAwards: "الترم ده فيه نجوم، ما ينفعش يتمسح",
        generic: "حصلت مشكلة، جرب تاني",
      },
    },

    form: {
      name: "الاسم بالكامل",
      nameHintKid: "الاسم الأول والتاني على الأقل (بيظهر في الترتيب)",
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
      branch: "الفرع",
      branchHint:"فرع الخادم (الحان, طقس, محفوظات, قبطي)",
      noBranch: "من غير فرع",
      create: "إضافة",
      creating: "ثواني...",
      save: "حفظ التعديلات",
      saving: "ثواني...",
      saved: "اتحفظ",
      choose: "اختار...",
    },

    roles: {
      kid: "طفل",
      servant: "خادم",
      admin: "مدير",
    } as Record<Role, string>,

    created: {
      title: "اتضاف الحساب",
      note: "كلمة السر دي بتظهر مرة واحدة بس، ابعتها لصاحبها دلوقتي.",
      another: "إضافة حساب تاني",
    },

    credentials: {
      name: "الاسم",
      phone: "الموبايل",
      password: "كلمة السر",
      copyAll: "نسخ الكل",
      copied: "اتنسخ",
      download: "تحميل ملف (Excel)",
    },

    edit: {
      title: "تعديل الحساب",
      resetTitle: "كلمة سر جديدة",
      resetHint: "بتفك القفل لو الحساب مقفول. سيب الخانة فاضية وهتتعمل كلمة سر لوحدها.",
      reset: "غير كلمة السر",
      resetDone: "كلمة السر الجديدة (بتظهر مرة واحدة):",
      statusTitle: "حالة الحساب",
      activeNow: "الحساب شغال",
      inactiveNow: "الحساب موقوف ومش هيقدر يدخل",
      deactivate: "إيقاف الحساب",
      activate: "تشغيل الحساب",
      notFound: "الحساب ده مش موجود",
      deleteTitle: "مسح الحساب",
      deleteHint: "بيمسح الطفل وكل نجومه نهائيًا ومش هينفع ترجعه. لو مش متأكد، استخدم «إيقاف الحساب» اللي فوق بدل المسح.",
      delete: "مسح الحساب",
      deleteConfirm: (name: string, stars: number) =>
        stars > 0
          ? `متأكد إنك عايز تمسح ${name} وكل نجومه (${arabicNumber(stars)})؟ مش هينفع ترجعه.`
          : `متأكد إنك عايز تمسح ${name}؟ مش هينفع ترجعه.`,
      deleteYes: "أيوه، امسح نهائيًا",
      deleteNo: "لأ، سيبه",
      deleting: "بمسح...",
      graduatedNow: (year: number) => `الحساب ده خريج ${arabicNumber(year, true)} ومتوقف. لو شغّلته هيرجع من الأرشيف.`,
    },

    errors: {
      generic: "حصلت مشكلة، جرب تاني",
      phoneTaken: (name: string) => `الرقم ده مسجل قبل كده باسم ${name}`,
      shortPassword: "كلمة السر لازم تكون ٦ حروف أو أرقام على الأقل",
      ownRole: "مينفعش تغير نوع حسابك أنت",
      ownDeactivate: "مينفعش توقف حسابك أنت",
      badRole: "نوع الحساب مش مظبوط",
      badBranch: "الفرع ده مش موجود",
      notKid: "الخدام والمديرين مينفعش يتمسحوا، وقّف الحساب بدل كده",
    },

    import: {
      title: "استيراد من إكسل",
      intro: "انسخ الأعمدة من إكسل (أو ملف CSV) والصقها هنا. يفضل أول سطر يكون عناوين الأعمدة.",
      kindLabel: "هتستورد",
      kindKid: "أطفال",
      kindServant: "خدام",
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

/** "نجمة واحدة"، "نجمتين"، "٣ نجوم"، "١١ نجمة" (Arabic number agreement). */
export function starsCount(n: number): string {
  if (n === 1) return "نجمة واحدة";
  if (n === 2) return "نجمتين";
  return n >= 3 && n <= 10 ? `${arabicNumber(n)} نجوم` : `${arabicNumber(n)} نجمة`;
}

/** "طفل واحد"، "طفلين"، "٣ أطفال"، "١١ طفل". */
export function kidsCount(n: number): string {
  if (n === 1) return "طفل واحد";
  if (n === 2) return "طفلين";
  return n >= 3 && n <= 10 ? `${arabicNumber(n)} أطفال` : `${arabicNumber(n)} طفل`;
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
    case "admin":
      return f ? "مديرة" : "مدير";
  }
}

/** Numbers shown to people use Arabic-Indic digits (٤٧). */
export function arabicNumber(n: number, plain = false): string {
  // Years are written without a thousands separator (٢٠٢٧, not ٢٬٠٢٧).
  return n.toLocaleString("ar-EG", { useGrouping: !plain });
}
