import { useRef, useState, type CSSProperties } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Palette,
  Plus,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { Editable } from '@/components/editable';
import { compressImage, slugifyUsername, uploadImage } from '@/lib/account';
import {
  COLOR_PRESETS,
  STYLE_NAMES,
  STYLE_ORDER,
  getItems,
  getTemplate,
  groupItems,
  styleOf,
  supportsImages,
  withItems,
  type Draft,
  type Item,
  type SiteStyle,
} from '@/lib/studio';

const TEXT = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';

export interface ServiceCardProps {
  draft: Draft;
  dirty: boolean;
  saving: boolean;
  justSaved: boolean;
  flash: number[];
  flashField?: string;
  canUndo: boolean;
  url?: string;
  stats?: { today: number; total: number };
  onUndo: () => void;
  onChange: (next: Draft) => void;
  onSave: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onNotice: (text: string) => void;
}

export function ServiceCard(props: ServiceCardProps) {
  const { draft, dirty, saving, justSaved, flash, flashField, canUndo, url, stats } = props;
  const tpl = getTemplate(draft.templateId);
  const items = getItems(draft);
  const style = styleOf(draft);
  const groups = groupItems(items);
  const namedGroups = groups.filter((g) => g.name);
  const showSections = tpl.hasSections;
  const photos = supportsImages(draft.templateId, style) && !draft.isNew;
  const [styleOpen, setStyleOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<number>(-1);

  const str = (key: string) => (typeof draft.structure[key] === 'string' ? (draft.structure[key] as string) : '');
  const setStructure = (patch: Record<string, unknown>) =>
    props.onChange({ ...draft, structure: { ...draft.structure, ...patch } });

  const setItem = (index: number, patch: Partial<Item>) =>
    props.onChange(withItems(draft, items.map((it, i) => (i === index ? { ...it, ...patch } : it))));
  const removeItem = (index: number) => props.onChange(withItems(draft, items.filter((_, i) => i !== index)));

  const addItem = (category?: string) => {
    const entry: Item = { [tpl.nameField]: `${tpl.noun} جديد` };
    if (tpl.hasPrice) entry.price = '';
    if (category) entry.category = category;
    props.onChange(withItems(draft, [...items, entry]));
  };
  const addSection = () => {
    let n = namedGroups.length + 1;
    let name = `قسم ${n}`;
    while (namedGroups.some((g) => g.name === name)) name = `قسم ${++n}`;
    const entry: Item = { [tpl.nameField]: `${tpl.noun} جديد`, category: name };
    if (tpl.hasPrice) entry.price = '';
    props.onChange(withItems(draft, [...items, entry]));
  };
  const renameSection = (from: string, to: string) => {
    if (!to || to === from) return;
    props.onChange(withItems(draft, items.map((it) => ((it.category ?? '').trim() === from ? { ...it, category: to } : it))));
  };
  const removeSection = (name: string) =>
    props.onChange(withItems(draft, items.filter((it) => (it.category ?? '').trim() !== name)));

  const pickPhoto = (index: number) => {
    uploadTarget.current = index;
    fileRef.current?.click();
  };
  const onFile = async (file: File | undefined) => {
    const index = uploadTarget.current;
    if (!file || index < 0) return;
    setUploading(index);
    try {
      const url = await uploadImage(await compressImage(file));
      setItem(index, { image: url });
    } catch (err) {
      props.onNotice(err instanceof Error ? err.message : 'تعذّر رفع الصورة. حاول مرة أخرى.');
    } finally {
      setUploading(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const copyUrl = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      props.onNotice(url);
    }
  };

  const flashing = (i: number) => flash.includes(i);

  const renderRow = (index: number) => {
    const item = items[index];
    const name = item[tpl.nameField] ?? '';
    return (
      <div
        key={index}
        id={`studio-item-${index}`}
        className={`group/row flex items-center gap-2 rounded-xl border bg-white px-2.5 py-2 transition-colors focus-within:border-[var(--studio-accent)] ${flashing(index) ? 'studio-flash' : ''}`}
        style={{ borderColor: BORDER }}
      >
        {photos && (
          <button
            type="button"
            onClick={() => pickPhoto(index)}
            aria-label={`صورة ${tpl.noun}`}
            className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed bg-[#F8FAFC] text-[#94A3B8] hover:border-[var(--studio-accent)] hover:text-[var(--studio-accent)]"
            style={{ borderColor: '#CBD5E1' }}
          >
            {uploading === index ? (
              <Loader2 size={16} className="animate-spin" />
            ) : item.image ? (
              <img src={item.image} alt="" className="size-full object-cover" />
            ) : (
              <ImagePlus size={16} />
            )}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <Editable
            value={name}
            placeholder={`اسم ${tpl.noun}`}
            ariaLabel={`اسم ${tpl.noun}`}
            onCommit={(v) => setItem(index, { [tpl.nameField]: v })}
            className="text-[15px] font-bold"
            style={{ color: TEXT }}
          />
          {draft.templateId === 'booking' && (
            <div>
              <Editable
                value={item.duration ?? ''}
                placeholder="المدة"
                ariaLabel="مدة الخدمة"
                hint={false}
                onCommit={(v) => setItem(index, { duration: v })}
                className="text-xs"
                style={{ color: MUTED }}
              />
            </div>
          )}
        </div>
        {tpl.hasPrice && (
          <Editable
            value={item.price ?? ''}
            placeholder="السعر"
            ariaLabel={`سعر ${name || tpl.noun}`}
            inputMode="decimal"
            hint={false}
            onCommit={(v) => setItem(index, { price: v })}
            className="text-sm font-extrabold"
            style={{ color: 'var(--studio-accent)' }}
          />
        )}
        <button
          type="button"
          onClick={() => removeItem(index)}
          aria-label={`حذف ${name || tpl.noun}`}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#BE123C]"
        >
          <X size={14} />
        </button>
      </div>
    );
  };

  const cardStyle = { '--studio-accent': draft.themeColor, borderColor: BORDER } as CSSProperties;

  return (
    <section
      dir="rtl"
      aria-label="بطاقة الخدمة"
      className="overflow-hidden rounded-2xl border bg-white shadow-[0_10px_30px_-14px_rgba(15,23,42,0.18)]"
      style={cardStyle}
    >
      <div className="h-1 w-full transition-colors duration-300" style={{ backgroundColor: 'var(--studio-accent)' }} />

      {/* Toolbar: style + color + undo + more */}
      <div className="flex items-center gap-2 px-4 pt-3.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setStyleOpen((v) => !v)}
            aria-expanded={styleOpen}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#F1F5F9] px-3 text-xs font-bold hover:bg-[#E2E8F0]"
            style={{ color: TEXT }}
          >
            <Palette size={14} />
            تغيير النمط
          </button>
          {styleOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-20 w-48 rounded-xl border bg-white p-1.5 shadow-xl"
              style={{ borderColor: BORDER }}
            >
              {STYLE_ORDER.map((s: SiteStyle) => (
                <button
                  key={s}
                  role="menuitemradio"
                  aria-checked={style === s}
                  type="button"
                  onClick={() => {
                    setStructure({ templateStyle: s, darkMode: s === 'cinematic' ? true : draft.structure.darkMode });
                    setStyleOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold hover:bg-[#F1F5F9]"
                  style={{ color: TEXT }}
                >
                  {STYLE_NAMES[s]}
                  {style === s && <Check size={14} style={{ color: '#2563EB' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-2.5 py-1.5" role="radiogroup" aria-label="لون الهوية">
          {COLOR_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              role="radio"
              aria-checked={draft.themeColor.toLowerCase() === hex.toLowerCase()}
              aria-label={`اللون ${hex}`}
              onClick={() => props.onChange({ ...draft, themeColor: hex })}
              className="size-5 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: hex,
                boxShadow: draft.themeColor.toLowerCase() === hex.toLowerCase() ? `0 0 0 2px #fff, 0 0 0 4px ${hex}` : 'none',
              }}
            />
          ))}
        </div>

        <div className="ms-auto flex items-center gap-1">
          {canUndo && (
            <button
              type="button"
              onClick={props.onUndo}
              aria-label="تراجع"
              className="grid size-9 place-items-center rounded-xl text-[#475569] hover:bg-[#F1F5F9]"
            >
              <Undo2 size={16} />
            </button>
          )}
          {!draft.isNew && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-label="المزيد"
                className="grid size-9 place-items-center rounded-xl text-[#475569] hover:bg-[#F1F5F9]"
              >
                <MoreHorizontal size={18} />
              </button>
              {moreOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-[calc(100%+6px)] z-20 w-64 space-y-1 rounded-xl border bg-white p-2 shadow-xl"
                  style={{ borderColor: BORDER }}
                >
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] font-bold" style={{ color: MUTED }}>رابط الخدمة</p>
                    <div dir="ltr" className="mt-1 flex items-center rounded-lg bg-[#F8FAFC] px-2 py-1.5 text-xs font-bold" style={{ color: TEXT }}>
                      <span style={{ color: MUTED }}>/</span>
                      <Editable
                        value={draft.username}
                        placeholder="my-site"
                        ariaLabel="رابط الخدمة"
                        hint={false}
                        onCommit={(v) => props.onChange({ ...draft, username: slugifyUsername(v) })}
                      />
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-xs font-bold hover:bg-[#F1F5F9]" style={{ color: TEXT }}>
                    إظهار شارة «صُنع بواسطة ORxai»
                    <input
                      type="checkbox"
                      checked={draft.showBranding}
                      onChange={(e) => props.onChange({ ...draft, showBranding: e.target.checked })}
                      className="size-4 accent-[#2563EB]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirmDelete) setConfirmDelete(true);
                      else props.onDelete();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-[#BE123C] hover:bg-[#FEF2F2]"
                  >
                    <Trash2 size={14} />
                    {confirmDelete ? 'اضغط مرة أخرى لتأكيد حذف الخدمة' : 'حذف هذه الخدمة'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title block */}
      <div className="px-5 pb-1 pt-4">
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
          style={{ backgroundColor: 'color-mix(in srgb, var(--studio-accent) 12%, white)', color: 'var(--studio-accent)' }}
        >
          {tpl.label}
        </span>
        <h2 className="mt-2 text-[22px] font-black leading-snug" style={{ color: TEXT }}>
          <Editable
            value={draft.siteName}
            placeholder="اسم النشاط"
            ariaLabel="اسم النشاط"
            flash={flashField === 'siteName'}
            onCommit={(v) => v && props.onChange({ ...draft, siteName: v })}
          />
        </h2>
        <p className="mt-1 text-sm font-bold" style={{ color: 'var(--studio-accent)' }}>
          <Editable
            value={str('headline')}
            placeholder="عنوان الخدمة"
            ariaLabel="عنوان الخدمة"
            flash={flashField === 'headline'}
            onCommit={(v) => setStructure({ headline: v })}
          />
        </p>
        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: MUTED }}>
          <Editable
            value={str('description')}
            placeholder="اكتب وصفاً قصيراً"
            ariaLabel="وصف الخدمة"
            multiline
            flash={flashField === 'description'}
            onCommit={(v) => setStructure({ description: v, tagline: v.slice(0, 120) })}
          />
        </p>
      </div>

      {/* Collection */}
      <div className="space-y-3 px-4 pb-2 pt-3">
        {showSections ? (
          <>
            {groups.map((group) => (
              <div key={group.name || '__none'} className="rounded-2xl border bg-[#F8FAFC] p-2.5" style={{ borderColor: BORDER }}>
                {(group.name || namedGroups.length > 0) && (
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span className="size-2 rounded-full" style={{ backgroundColor: 'var(--studio-accent)' }} />
                    {group.name ? (
                      <Editable
                        value={group.name}
                        placeholder="اسم القسم"
                        ariaLabel="اسم القسم"
                        onCommit={(v) => renameSection(group.name, v)}
                        className="text-[13px] font-extrabold"
                        style={{ color: TEXT }}
                      />
                    ) : (
                      <span className="text-[13px] font-extrabold" style={{ color: MUTED }}>بدون قسم</span>
                    )}
                    {group.name && (
                      <button
                        type="button"
                        onClick={() => removeSection(group.name)}
                        aria-label={`حذف القسم ${group.name}`}
                        className="ms-auto grid size-7 place-items-center rounded-lg text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#BE123C]"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">{group.indexes.map(renderRow)}</div>
                <button
                  type="button"
                  onClick={() => addItem(group.name || undefined)}
                  className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#EFF6FF] px-3 text-xs font-bold hover:bg-[#DBEAFE]"
                  style={{ color: '#1D4ED8' }}
                >
                  <Plus size={14} />
                  إضافة {tpl.noun} جديد
                </button>
              </div>
            ))}
            {groups.length === 0 && (
              <button
                type="button"
                onClick={() => addItem()}
                className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed text-xs font-bold"
                style={{ borderColor: '#93C5FD', color: '#1D4ED8', backgroundColor: '#EFF6FF' }}
              >
                <Plus size={14} />
                أضف أول {tpl.noun}
              </button>
            )}
            <button
              type="button"
              onClick={addSection}
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed text-xs font-bold hover:bg-[#EFF6FF]"
              style={{ borderColor: '#93C5FD', color: '#1D4ED8' }}
            >
              <Plus size={14} />
              إضافة قسم
            </button>
          </>
        ) : (
          <div className="rounded-2xl border bg-[#F8FAFC] p-2.5" style={{ borderColor: BORDER }}>
            <div className="space-y-1.5">{items.map((_, i) => renderRow(i))}</div>
            <button
              type="button"
              onClick={() => addItem()}
              className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#EFF6FF] px-3 text-xs font-bold hover:bg-[#DBEAFE]"
              style={{ color: '#1D4ED8' }}
            >
              <Plus size={14} />
              إضافة {tpl.noun} جديد
            </button>
          </div>
        )}
        {!photos && !draft.isNew && (tpl.collectionKey === 'items' || tpl.collectionKey === 'projects') && items.length > 0 && (
          <p className="px-1 text-[11px]" style={{ color: MUTED }}>
            الصور لا تظهر بالنمط الحالي — اختر «سينمائي» أو «تطبيق جوال» لإضافة صورة لكل {tpl.noun}.
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: BORDER }}>
        <div className="mb-2.5 flex items-center justify-between text-[11px] font-bold" style={{ color: MUTED }}>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: saving ? '#2563EB' : dirty ? '#F59E0B' : '#10B981' }}
            />
            {saving ? 'جارٍ الحفظ…' : justSaved ? 'تم الحفظ ✓' : draft.isNew ? 'مسودة — لم تُنشر بعد' : dirty ? 'تغييرات غير محفوظة' : 'كل شيء محفوظ'}
          </span>
          {stats && (
            <span>
              زيارات اليوم {stats.today} · الإجمالي {stats.total}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={props.onSave}
            disabled={saving || (!dirty && !draft.isNew)}
            className="inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.7)] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: '#2563EB' }}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {draft.isNew ? 'نشر الخدمة' : 'حفظ التغييرات'}
          </button>
          <button
            type="button"
            onClick={props.onPreview}
            disabled={saving}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border bg-white text-sm font-extrabold hover:bg-[#F8FAFC] disabled:opacity-50"
            style={{ borderColor: '#CBD5E1', color: TEXT }}
          >
            معاينة حية
          </button>
        </div>
        {url && !draft.isNew && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2">
            <span dir="ltr" className="min-w-0 flex-1 truncate text-xs font-bold" style={{ color: MUTED }}>
              {url.replace(/^https?:\/\//, '')}
            </span>
            <button type="button" onClick={copyUrl} aria-label="نسخ الرابط" className="grid size-7 place-items-center rounded-lg text-[#475569] hover:bg-white">
              {copied ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
            </button>
            <a href={url} target="_blank" rel="noreferrer" aria-label="فتح الموقع" className="grid size-7 place-items-center rounded-lg text-[#475569] hover:bg-white">
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
    </section>
  );
}
