// Pure logic behind the conversational studio (no React): what each service
// type contains, the starter content for a new draft, and the Arabic command
// interpreter that turns free text ("زد الأسعار 5 ريال") into a concrete edit.
// Kept framework-free so it can be unit-tested and reused by the WhatsApp bot.

export type SiteStyle = 'classic' | 'modern' | 'cinematic' | 'app';
export type Item = Record<string, string>;
export type Structure = Record<string, unknown>;

export interface TemplateDef {
  id: string;
  label: string; // short pill / chip label
  collectionKey: 'items' | 'services' | 'projects';
  noun: string; // what one entry is called
  nameField: 'name' | 'title';
  hasPrice: boolean;
  hasSections: boolean;
  keywords: string[]; // normalized (see normalize())
  starter: { siteName: string; headline: string; description: string; sections: Array<{ name: string; items: Item[] }> };
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'restaurant', label: 'مطعم / كافيه', collectionKey: 'items', noun: 'صنف', nameField: 'name', hasPrice: true, hasSections: true,
    keywords: ['منيو', 'مطعم', 'كافيه', 'مقهي', 'قهوه', 'وجبات', 'اكل', 'حلويات'],
    starter: {
      siteName: 'مطعمي', headline: 'منيو مطعمي', description: 'أشهى الوجبات تُحضَّر طازجة كل يوم.',
      sections: [
        { name: 'الوجبات الرئيسية', items: [{ name: 'وجبة شاورما', price: '15 ر.س' }, { name: 'وجبة شاورما دبل', price: '20 ر.س' }] },
        { name: 'المشروبات', items: [{ name: 'عصير برتقال', price: '8 ر.س' }] },
      ],
    },
  },
  {
    id: 'store', label: 'متجر إلكتروني', collectionKey: 'items', noun: 'منتج', nameField: 'name', hasPrice: true, hasSections: true,
    keywords: ['متجر', 'بيع', 'منتجات', 'محل', 'سلع', 'ملابس', 'تسوق'],
    starter: {
      siteName: 'متجري', headline: 'متجري الإلكتروني', description: 'منتجات مختارة بعناية مع توصيل سريع.',
      sections: [{ name: 'الأكثر طلباً', items: [{ name: 'منتج مميز', price: '50 ر.س' }, { name: 'منتج اقتصادي', price: '25 ر.س' }] }],
    },
  },
  {
    id: 'booking', label: 'حجز مواعيد', collectionKey: 'services', noun: 'خدمة', nameField: 'name', hasPrice: true, hasSections: false,
    keywords: ['حجز', 'مواعيد', 'موعد', 'عياده', 'صالون', 'حلاق', 'جلسات'],
    starter: {
      siteName: 'حجوزاتي', headline: 'احجز موعدك بسهولة', description: 'اختر الخدمة والوقت المناسب وسنؤكد حجزك فوراً.',
      sections: [{ name: '', items: [{ name: 'استشارة', price: '100 ر.س', duration: '30 دقيقة' }, { name: 'جلسة كاملة', price: '250 ر.س', duration: '60 دقيقة' }] }],
    },
  },
  {
    id: 'services', label: 'شركة / مؤسسة', collectionKey: 'services', noun: 'خدمة', nameField: 'name', hasPrice: true, hasSections: false,
    keywords: ['شركه', 'مؤسسه', 'خدمات', 'مكتب', 'مقاولات'],
    starter: {
      siteName: 'شركتي', headline: 'خدمات احترافية لعملائنا', description: 'فريق متخصص يقدم حلولاً موثوقة بجودة عالية.',
      sections: [{ name: '', items: [{ name: 'خدمة أساسية', price: '300 ر.س' }, { name: 'خدمة متقدمة', price: '700 ر.س' }] }],
    },
  },
  {
    id: 'portfolio', label: 'صفحة شخصية', collectionKey: 'projects', noun: 'مشروع', nameField: 'title', hasPrice: false, hasSections: true,
    keywords: ['معرض', 'اعمالي', 'سيره', 'بورتفوليو', 'شخصي', 'تعريفيه'],
    starter: {
      siteName: 'أعمالي', headline: 'أهلاً، أنا هنا لأصنع أعمالاً تُرى', description: 'نبذة قصيرة عني وأبرز ما أنجزته.',
      sections: [{ name: 'أحدث الأعمال', items: [{ title: 'مشروع أول' }, { title: 'مشروع ثانٍ' }] }],
    },
  },
  {
    id: 'survey', label: 'استبيان وتقييم', collectionKey: 'items', noun: 'سؤال', nameField: 'name', hasPrice: false, hasSections: false,
    keywords: ['استبيان', 'استطلاع', 'تقييم', 'رايكم'],
    starter: { siteName: 'استبياني', headline: 'رأيك يهمنا', description: 'أجب عن أسئلة قصيرة تساعدنا على التطوير.', sections: [] },
  },
  {
    id: 'rsvp', label: 'دعوة وتأكيد حضور', collectionKey: 'items', noun: 'فقرة', nameField: 'name', hasPrice: false, hasSections: false,
    keywords: ['دعوه', 'حفل', 'زفاف', 'حضور', 'مناسبه'],
    starter: {
      siteName: 'دعوتي', headline: 'يسعدنا حضورك', description: 'نتشرف بدعوتكم لمشاركتنا هذه المناسبة.',
      sections: [{ name: '', items: [{ name: 'استقبال الضيوف' }, { name: 'العشاء' }] }],
    },
  },
  {
    id: 'vcard', label: 'بطاقة رقمية', collectionKey: 'items', noun: 'رابط', nameField: 'name', hasPrice: false, hasSections: false,
    keywords: ['بطاقه', 'كرت', 'روابط', 'فيزيت'],
    starter: { siteName: 'بطاقتي', headline: 'تواصل معي مباشرة', description: 'كل روابطي في مكان واحد.', sections: [{ name: '', items: [{ name: 'واتساب' }, { name: 'إنستغرام' }] }] },
  },
  {
    id: 'invoice', label: 'باقات وعروض أسعار', collectionKey: 'services', noun: 'باقة', nameField: 'name', hasPrice: true, hasSections: false,
    keywords: ['باقات', 'باقه', 'عرض سعر', 'عروض', 'فاتوره', 'تسعير'],
    starter: {
      siteName: 'باقاتي', headline: 'اختر الباقة المناسبة', description: 'باقات واضحة بأسعار شفافة.',
      sections: [{ name: '', items: [{ name: 'الباقة الأساسية', price: '500 ر.س' }, { name: 'الباقة المتقدمة', price: '1200 ر.س' }] }],
    },
  },
];

export const STYLE_NAMES: Record<SiteStyle, string> = {
  classic: 'كلاسيكي أنيق',
  modern: 'عصري',
  cinematic: 'سينمائي فاخر',
  app: 'تطبيق جوال',
};
export const STYLE_ORDER: SiteStyle[] = ['modern', 'classic', 'cinematic', 'app'];

export const COLOR_PRESETS = ['#2563EB', '#0F172A', '#059669', '#BE123C', '#6D28D9', '#EA580C', '#0F766E', '#DB2777'];

export const getTemplate = (id: string): TemplateDef => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[1];

// ---------------------------------------------------------------------------
// Draft model
// ---------------------------------------------------------------------------

export interface Draft {
  isNew: boolean;
  id?: string;
  username: string;
  siteName: string;
  templateId: string;
  themeColor: string;
  showBranding: boolean;
  structure: Structure;
}

export function newDraft(templateId: string, overrides: { siteName?: string } = {}): Draft {
  const tpl = getTemplate(templateId);
  const items: Item[] = [];
  for (const section of tpl.starter.sections) {
    for (const item of section.items) items.push(section.name ? { ...item, category: section.name } : { ...item });
  }
  return {
    isNew: true,
    username: '',
    siteName: overrides.siteName?.trim() || tpl.starter.siteName,
    templateId: tpl.id,
    themeColor: COLOR_PRESETS[0],
    showBranding: true,
    structure: {
      headline: overrides.siteName?.trim() ? undefined : tpl.starter.headline,
      tagline: tpl.starter.description,
      description: tpl.starter.description,
      templateStyle: 'modern',
      darkMode: false,
      [tpl.collectionKey]: items,
    },
  };
}

export function getItems(draft: Draft): Item[] {
  const raw = draft.structure[getTemplate(draft.templateId).collectionKey];
  return Array.isArray(raw) ? (raw as Item[]) : [];
}

export function withItems(draft: Draft, items: Item[]): Draft {
  return { ...draft, structure: { ...draft.structure, [getTemplate(draft.templateId).collectionKey]: items } };
}

export interface Group { name: string; indexes: number[] }

// Sections are the distinct `category` values, in first-appearance order. The
// server's whitelist has no separate "sections" field, so a category *is* the
// section — which is also exactly what the public templates group by.
export function groupItems(items: Item[]): Group[] {
  const groups: Group[] = [];
  items.forEach((item, index) => {
    const name = (item.category ?? '').trim();
    let group = groups.find((g) => g.name === name);
    if (!group) {
      group = { name, indexes: [] };
      groups.push(group);
    }
    group.indexes.push(index);
  });
  return groups;
}

// Mirrors the server's ground truth (site-schema.ts → supportsCollectionImages)
// so a draft knows whether a photo per item would actually be displayed.
export function supportsImages(templateId: string, style: SiteStyle): boolean {
  if (['booking', 'survey', 'vcard', 'rsvp', 'invoice'].includes(templateId)) return false;
  if (style === 'cinematic' || style === 'app') return true;
  if (templateId === 'store') return true;
  if (templateId === 'portfolio') return style === 'classic';
  return false;
}

export function styleOf(draft: Draft): SiteStyle {
  const s = draft.structure.templateStyle;
  return s === 'classic' || s === 'cinematic' || s === 'app' || s === 'modern' ? s : 'modern';
}

export function isDirty(a: Draft, b: Draft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Arabic text helpers
// ---------------------------------------------------------------------------

// 1:1 character replacements only, so indexes in the normalized string map
// straight back onto the original (used to cut values out of the user's text).
export function normalize(input: string): string {
  return input
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .toLowerCase();
}

const stripDiacritics = (s: string) => s.replace(/[\u064B-\u065F\u0670\u0640]/g, '');

const COLORS: Array<{ words: string[]; hex: string; label: string }> = [
  { words: ['احمر', 'احمرار'], hex: '#BE123C', label: 'الأحمر' },
  { words: ['اخضر', 'زمردي'], hex: '#059669', label: 'الأخضر' },
  { words: ['ازرق', 'ازرق ملكي'], hex: '#2563EB', label: 'الأزرق' },
  { words: ['كحلي', 'نيلي'], hex: '#0F172A', label: 'الكحلي' },
  { words: ['اسود'], hex: '#0F172A', label: 'الأسود' },
  { words: ['بنفسجي', 'موف'], hex: '#6D28D9', label: 'البنفسجي' },
  { words: ['برتقالي'], hex: '#EA580C', label: 'البرتقالي' },
  { words: ['فيروزي', 'تركوازي', 'تيل'], hex: '#0F766E', label: 'الفيروزي' },
  { words: ['وردي', 'زهري', 'روز'], hex: '#DB2777', label: 'الوردي' },
  { words: ['ذهبي', 'ذهب'], hex: '#B45309', label: 'الذهبي' },
];

const STYLE_WORDS: Array<{ words: string[]; style: SiteStyle }> = [
  { words: ['كلاسيك'], style: 'classic' },
  { words: ['عصري', 'مودرن', 'حديث'], style: 'modern' },
  { words: ['سينمائي', 'فاخر', 'سينما'], style: 'cinematic' },
  { words: ['تطبيق', 'ابلكيشن'], style: 'app' },
];

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

export function adjustPrice(price: string | undefined, mode: 'add' | 'sub' | 'pct', amount: number): string | undefined {
  if (!price) return price;
  const m = normalize(price).match(/\d+(?:\.\d+)?/);
  if (!m || m.index === undefined) return price;
  const current = parseFloat(m[0]);
  let next = mode === 'add' ? current + amount : mode === 'sub' ? current - amount : current * (1 + amount / 100);
  next = Math.max(0, Math.round(next * 100) / 100);
  const text = Number.isInteger(next) ? String(next) : String(next);
  return price.slice(0, m.index) + text + price.slice(m.index + m[0].length);
}

// ---------------------------------------------------------------------------
// Command interpreter
// ---------------------------------------------------------------------------

export type Action =
  | { kind: 'create'; templateId?: string; siteName?: string }
  | { kind: 'price'; mode: 'add' | 'sub' | 'pct'; amount: number; section?: string }
  | { kind: 'addItem'; name: string; price?: string; section?: string }
  | { kind: 'addSection'; name: string }
  | { kind: 'color'; hex: string; label: string }
  | { kind: 'openColors' }
  | { kind: 'style'; style: SiteStyle }
  | { kind: 'openStyles' }
  | { kind: 'rename'; field: 'siteName' | 'headline' | 'description'; value: string }
  | { kind: 'remove'; target: string }
  | { kind: 'stats' }
  | { kind: 'undo' }
  | { kind: 'unknown' };

const CREATE_VERB = /(ابغ[يىا]?|ابي|اريد|بغيت|ودي|حاب)\s*(ان\s*)?(اسوي|اعمل|انش[ئي]?|انشاء|اصمم|اسوى)|^(انش[ئي]?|انشاء|سوي|اعمل|صمم)\s/;
const UP = /(زد|زيد|زياده|ارفع|رفع|غلي|اضف على|زود)/;
const DOWN = /(خفض|نزل|انقص|قلل|نقص|تخفيض|خصم|رخص)/;
const NUM = /(\d+(?:\.\d+)?)/;

export function detectTemplate(norm: string): string | undefined {
  let best: { id: string; score: number } | undefined;
  for (const t of TEMPLATES) {
    const score = t.keywords.filter((k) => norm.includes(k)).length;
    if (score > 0 && (!best || score > best.score)) best = { id: t.id, score };
  }
  return best?.id;
}

function tail(original: string, norm: string, regex: RegExp): string | undefined {
  const m = norm.match(regex);
  if (!m || m.index === undefined) return undefined;
  const end = m.index + m[0].length;
  const value = original.slice(end).replace(/^[\s:،,\-–]+/, '').trim();
  return value || undefined;
}

export function interpret(textRaw: string, ctx: { sectionNames: string[]; hasSite: boolean }): Action {
  const original = stripDiacritics(textRaw).trim();
  const norm = normalize(original);
  if (!norm) return { kind: 'unknown' };

  if (/^(تراجع|الغاء|رجع)/.test(norm)) return { kind: 'undo' };
  if (/(زائر|زيارات|احصائ|كم زار)/.test(norm)) return { kind: 'stats' };

  // New service: "أبغى أسوي منيو لمطعمي", "انشئ متجر باسم هلا"
  if (CREATE_VERB.test(norm) || (!ctx.hasSite && detectTemplate(norm))) {
    const nameMatch = tail(original, norm, /(باسم|اسمه|اسمها|اسم[هاي]?)\s*/);
    return { kind: 'create', templateId: detectTemplate(norm), siteName: nameMatch };
  }

  const section = ctx.sectionNames.find((s) => s && norm.includes(normalize(s)));

  // Prices: "عدّل الأسعار وزدها 5 ريال", "خفض أسعار المشروبات 10%"
  const num = norm.match(NUM);
  if (num && /(سعر|اسعار|ريال|%|٪|بالمئه|بالمايه)/.test(norm) && (UP.test(norm) || DOWN.test(norm)) && !/^(اضف|ضيف)\s*(صنف|طبق|منتج|خدمه|باقه)/.test(norm)) {
    const pct = /(%|٪|بالمئه|بالمايه|في المايه)/.test(norm);
    const down = DOWN.test(norm) && !UP.test(norm);
    const amount = parseFloat(num[1]);
    return { kind: 'price', mode: pct ? 'pct' : down ? 'sub' : 'add', amount: pct && down ? -amount : amount, section };
  }

  // Colors
  const colorIntent = /(لون|الوان)/.test(norm);
  const color = COLORS.find((c) => c.words.some((w) => norm.includes(w)));
  if (color && (colorIntent || /(غير|بدل|خله|خلي|اجعل)/.test(norm))) return { kind: 'color', hex: color.hex, label: color.label };
  if (colorIntent) return { kind: 'openColors' };

  // Style
  if (/(نمط|تصميم|ستايل|شكل)/.test(norm)) {
    const hit = STYLE_WORDS.find((s) => s.words.some((w) => norm.includes(w)));
    return hit ? { kind: 'style', style: hit.style } : { kind: 'openStyles' };
  }

  // Description / headline / name
  const desc = tail(original, norm, /^(وصف|نبذه|الوصف)\s*:?\s*/);
  if (desc) return { kind: 'rename', field: 'description', value: desc };
  const head = tail(original, norm, /^(عنوان|العنوان|العنوان الرئيسي)\s*:?\s*/);
  if (head) return { kind: 'rename', field: 'headline', value: head };
  const renamed = tail(original, norm, /(غير|عدل|بدل)\s*(ال)?اسم(\s*(ال)?(نشاط|موقع|متجر|مطعم|خدمه))?\s*(الي|ل|الى|:)?\s*/);
  if (renamed) return { kind: 'rename', field: 'siteName', value: renamed };

  // Add section
  const secName = tail(original, norm, /^(اضف|ضيف|اضافه|زد)\s*قسم(\s*جديد)?\s*:?\s*/);
  if (/^(اضف|ضيف|اضافه|زد)\s*قسم/.test(norm)) return { kind: 'addSection', name: secName ?? 'قسم جديد' };

  // Add item: "أضف شاورما دجاج 18" / "أضف منتج: قهوة 25 ر.س في قسم المشروبات"
  const add = norm.match(/^(اضف|ضيف|اضافه|زد)\s*(صنف|طبق|منتج|خدمه|مشروع|سؤال|باقه|رابط)?\s*(جديد)?\s*:?\s*/);
  if (add) {
    let rest = original.slice(add[0].length).trim();
    let restNorm = normalize(rest);
    let targetSection: string | undefined;
    const inSection = restNorm.match(/\s(في|الي|الى|ضمن)\s*قسم\s*/);
    if (inSection && inSection.index !== undefined) {
      targetSection = rest.slice(inSection.index + inSection[0].length).trim() || undefined;
      rest = rest.slice(0, inSection.index).trim();
      restNorm = normalize(rest);
    }
    const priceTail = restNorm.match(/\s*(?:ب|بسعر|سعره)?\s*(\d+(?:\.\d+)?)\s*(ريال|ر\.?\s?س|sar|\$|دولار)?\s*$/);
    let price: string | undefined;
    if (priceTail && priceTail.index !== undefined) {
      price = `${priceTail[1]} ر.س`;
      rest = rest.slice(0, priceTail.index).replace(/\s(ب|بسعر|سعره)$/, '').trim();
    }
    if (rest) return { kind: 'addItem', name: rest, price, section: targetSection ?? section };
  }

  // Remove
  const rm = norm.match(/^(احذف|امسح|شيل|ازل|ازاله|حذف)\s*(ال)?(صنف|طبق|منتج|خدمه|مشروع|قسم|سؤال|باقه)?\s*/);
  if (rm) {
    const target = original.slice(rm[0].length).replace(/^[\s:]+/, '').trim();
    if (target) return { kind: 'remove', target };
  }

  return { kind: 'unknown' };
}

// ---------------------------------------------------------------------------
// Applying an action to a draft
// ---------------------------------------------------------------------------

export interface ApplyResult {
  draft: Draft;
  reply: string;
  touched: number[]; // item indexes to flash
  field?: 'siteName' | 'headline' | 'description' | 'color' | 'style';
  changed: boolean;
}

function countLabel(n: number): string {
  if (n === 1) return 'صنف واحد';
  if (n === 2) return 'صنفان';
  return n <= 10 ? `${n} أصناف` : `${n} صنفاً`;
}

export function applyAction(draft: Draft, action: Action): ApplyResult {
  const tpl = getTemplate(draft.templateId);
  const items = getItems(draft);
  const none = (reply: string): ApplyResult => ({ draft, reply, touched: [], changed: false });

  switch (action.kind) {
    case 'price': {
      if (!tpl.hasPrice) return none('هذا النوع من الخدمات لا يعرض أسعاراً.');
      const touched: number[] = [];
      const next = items.map((item, i) => {
        if (!item.price) return item;
        if (action.section && (item.category ?? '').trim() !== action.section) return item;
        const updated = adjustPrice(item.price, action.mode === 'pct' ? 'pct' : action.mode, action.amount);
        if (updated !== item.price) touched.push(i);
        return { ...item, price: updated ?? item.price };
      });
      if (!touched.length) return none('لا توجد أصناف بأسعار لتعديلها.');
      const verb = action.mode === 'pct' ? (action.amount < 0 ? `خفضت الأسعار ${Math.abs(action.amount)}٪` : `رفعت الأسعار ${action.amount}٪`) : action.mode === 'sub' ? `خفضت الأسعار ${action.amount} ر.س` : `رفعت الأسعار ${action.amount} ر.س`;
      return { draft: withItems(draft, next), reply: `${verb}${action.section ? ` في «${action.section}»` : ''} — ${countLabel(touched.length)}. راجعها في البطاقة.`, touched, changed: true };
    }
    case 'addItem': {
      const entry: Item = { [tpl.nameField]: action.name };
      if (action.price && tpl.hasPrice) entry.price = action.price;
      const sectionName = action.section?.trim();
      if (sectionName && tpl.hasSections) entry.category = sectionName;
      else if (tpl.hasSections) {
        const last = groupItems(items).filter((g) => g.name).pop();
        if (last) entry.category = last.name;
      }
      const next = [...items, entry];
      return { draft: withItems(draft, next), reply: `أضفت «${action.name}»${entry.price ? ` بسعر ${entry.price}` : ''}${entry.category ? ` إلى «${entry.category}»` : ''}.`, touched: [next.length - 1], changed: true };
    }
    case 'addSection': {
      if (!tpl.hasSections) return none('هذا النوع من الخدمات لا يدعم الأقسام.');
      if (groupItems(items).some((g) => g.name === action.name)) return none(`القسم «${action.name}» موجود بالفعل.`);
      const entry: Item = { [tpl.nameField]: `${tpl.noun} جديد`, category: action.name };
      if (tpl.hasPrice) entry.price = '';
      const next = [...items, entry];
      return { draft: withItems(draft, next), reply: `أنشأت القسم «${action.name}» مع ${tpl.noun} واحد جاهز للتعديل.`, touched: [next.length - 1], changed: true };
    }
    case 'color':
      return { draft: { ...draft, themeColor: action.hex }, reply: `غيّرت لون الهوية إلى ${action.label}.`, touched: [], field: 'color', changed: draft.themeColor !== action.hex };
    case 'style':
      return { draft: { ...draft, structure: { ...draft.structure, templateStyle: action.style, darkMode: action.style === 'cinematic' ? true : draft.structure.darkMode } }, reply: `غيّرت النمط إلى «${STYLE_NAMES[action.style]}».`, touched: [], field: 'style', changed: styleOf(draft) !== action.style };
    case 'rename': {
      if (action.field === 'siteName') return { draft: { ...draft, siteName: action.value }, reply: `غيّرت اسم النشاط إلى «${action.value}».`, touched: [], field: 'siteName', changed: true };
      const structure = { ...draft.structure, [action.field]: action.value, ...(action.field === 'description' ? { tagline: action.value.slice(0, 120) } : {}) };
      return { draft: { ...draft, structure }, reply: action.field === 'description' ? 'حدّثت الوصف.' : 'حدّثت العنوان الرئيسي.', touched: [], field: action.field, changed: true };
    }
    case 'remove': {
      const t = normalize(action.target);
      const sec = groupItems(items).find((g) => g.name && normalize(g.name) === t);
      if (sec && tpl.hasSections) {
        const drop = new Set(sec.indexes);
        return { draft: withItems(draft, items.filter((_, i) => !drop.has(i))), reply: `حذفت القسم «${sec.name}» وما فيه (${sec.indexes.length}). يمكنك التراجع.`, touched: [], changed: true };
      }
      const idx = items.findIndex((it) => normalize(it[tpl.nameField] ?? '').includes(t) && t.length > 0);
      if (idx < 0) return none(`لم أجد «${action.target}» في البطاقة.`);
      const name = items[idx][tpl.nameField];
      return { draft: withItems(draft, items.filter((_, i) => i !== idx)), reply: `حذفت «${name}». يمكنك التراجع.`, touched: [], changed: true };
    }
    default:
      return none('');
  }
}

export const HELP_EXAMPLES = ['زد الأسعار 5 ريال', 'أضف قسم المقبلات', 'أضف عصير ليمون 9', 'غيّر اللون إلى أخضر', 'وصف: أفضل شاورما في الحي'];

// ---------------------------------------------------------------------------
// Gemini results (validated server-side in workers/manfaz-api/src/dashboard-ai.ts)
// ---------------------------------------------------------------------------

export type AiItem = Partial<Record<'name' | 'title' | 'price' | 'duration' | 'description' | 'category', string>>;

export type AiOp =
  | { op: 'set'; field: 'siteName' | 'headline' | 'description' | 'ctaLabel'; value: string }
  | { op: 'color'; hex: string }
  | { op: 'style'; style: string }
  | { op: 'addItem'; item: AiItem; section?: string }
  | { op: 'updateItem'; index: number; patch: AiItem }
  | { op: 'removeItem'; index: number }
  | { op: 'renameSection'; from: string; to: string }
  | { op: 'removeSection'; name: string }
  | { op: 'hours'; hours: Array<{ day: string; time: string }> }
  | { op: 'contact'; patch: Partial<Record<'phone' | 'whatsapp' | 'email' | 'address', string>> };

export interface AiCreate {
  templateId: string;
  siteName: string;
  headline: string;
  description: string;
  themeColor?: string;
  templateStyle?: string;
  items: AiItem[];
}

const isStyle = (v: string): v is SiteStyle => v === 'classic' || v === 'modern' || v === 'cinematic' || v === 'app';

// Maps an AI item onto the fields this template really has (e.g. portfolio
// uses `title`, only priced templates keep `price`, only sectioned ones keep
// `category`) so a hallucinated field can never leak into the saved site.
function itemFromAi(tpl: TemplateDef, ai: AiItem, section?: string): Item {
  const out: Item = {};
  const name = ai[tpl.nameField] ?? ai.name ?? ai.title;
  if (name) out[tpl.nameField] = name;
  if (tpl.hasPrice && ai.price !== undefined) out.price = ai.price;
  if (tpl.id === 'booking' && ai.duration) out.duration = ai.duration;
  if (ai.description) out.description = ai.description;
  const category = section ?? ai.category;
  if (tpl.hasSections && category) out.category = category;
  return out;
}

export function applyOps(draft: Draft, ops: AiOp[]): ApplyResult {
  const tpl = getTemplate(draft.templateId);
  let d = draft;
  let field: ApplyResult['field'];
  const touched = new Set<Item>();
  // Removed items become null placeholders so every index in the model's
  // answer keeps pointing at the item it saw; nulls are dropped at the end.
  let items: Array<Item | null> = [...getItems(d)];

  for (const op of ops) {
    switch (op.op) {
      case 'set':
        if (op.field === 'siteName') {
          d = { ...d, siteName: op.value };
          field = 'siteName';
        } else {
          d = {
            ...d,
            structure: { ...d.structure, [op.field]: op.value, ...(op.field === 'description' ? { tagline: op.value.slice(0, 120) } : {}) },
          };
          if (op.field !== 'ctaLabel') field = op.field;
        }
        break;
      case 'color':
        d = { ...d, themeColor: op.hex };
        field = 'color';
        break;
      case 'style':
        if (isStyle(op.style)) {
          d = { ...d, structure: { ...d.structure, templateStyle: op.style, darkMode: op.style === 'cinematic' ? true : d.structure.darkMode } };
          field = 'style';
        }
        break;
      case 'addItem': {
        const entry = itemFromAi(tpl, op.item, op.section);
        if (entry[tpl.nameField]) {
          items.push(entry);
          touched.add(entry);
        }
        break;
      }
      case 'updateItem': {
        const current = items[op.index];
        if (!current) break;
        const patch = itemFromAi(tpl, op.patch);
        const next: Item = { ...current, ...patch };
        items[op.index] = next;
        touched.add(next);
        break;
      }
      case 'removeItem':
        if (items[op.index]) items[op.index] = null;
        break;
      case 'renameSection':
        if (tpl.hasSections) items = items.map((it) => (it && (it.category ?? '').trim() === op.from ? { ...it, category: op.to } : it));
        break;
      case 'removeSection':
        if (tpl.hasSections) items = items.map((it) => (it && (it.category ?? '').trim() === op.name ? null : it));
        break;
      case 'hours':
        d = { ...d, structure: { ...d.structure, hours: op.hours } };
        break;
      case 'contact': {
        const prev = d.structure.contact && typeof d.structure.contact === 'object' ? (d.structure.contact as Record<string, unknown>) : {};
        d = { ...d, structure: { ...d.structure, contact: { ...prev, ...op.patch } } };
        break;
      }
    }
  }
  const kept = items.filter((it): it is Item => it !== null);
  d = withItems(d, kept);
  return {
    draft: d,
    reply: '',
    touched: kept.flatMap((it, i) => (touched.has(it) ? [i] : [])),
    field,
    changed: isDirty(d, draft),
  };
}

export function draftFromCreate(create: AiCreate): Draft {
  const tpl = getTemplate(create.templateId);
  const base = newDraft(tpl.id, { siteName: create.siteName });
  const items = create.items.map((it) => itemFromAi(tpl, it)).filter((it) => it[tpl.nameField]);
  return {
    ...base,
    themeColor: create.themeColor ?? base.themeColor,
    structure: {
      ...base.structure,
      headline: create.headline || create.siteName,
      description: create.description || tpl.starter.description,
      tagline: (create.description || tpl.starter.description).slice(0, 120),
      templateStyle: create.templateStyle && isStyle(create.templateStyle) ? create.templateStyle : 'modern',
      ...(items.length ? { [tpl.collectionKey]: items } : {}),
    },
  };
}
