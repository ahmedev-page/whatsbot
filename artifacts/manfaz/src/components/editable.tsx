import { useEffect, useRef, type CSSProperties } from 'react';
import { Pencil } from 'lucide-react';

// Click-to-edit text. The element *is* the text (no hidden input): tapping it
// focuses it with a soft ring, Enter or blur commits, Escape reverts. The
// pencil icon is a hint only — it never takes taps itself.
export function Editable({
  value,
  onCommit,
  placeholder,
  multiline = false,
  inputMode,
  className = '',
  style,
  ariaLabel,
  flash = false,
  hint = true,
}: {
  value: string;
  onCommit: (next: string) => void;
  placeholder: string;
  multiline?: boolean;
  inputMode?: 'text' | 'decimal' | 'numeric';
  className?: string;
  style?: CSSProperties;
  ariaLabel: string;
  flash?: boolean;
  hint?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Keep the DOM in sync with outside changes (chat edits, undo) without
  // fighting the caret while the user is typing.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value;
  }, [value]);

  const commit = () => {
    const el = ref.current;
    if (!el) return;
    const next = (el.textContent ?? '').replace(/\s+/g, multiline ? ' ' : ' ').trim();
    if (next !== value) onCommit(next);
    // If the parent rejected the edit (e.g. an empty required name) the value
    // prop never changes, so put the previous text back ourselves.
    window.requestAnimationFrame(() => {
      if (document.activeElement !== el && el.textContent !== valueRef.current) el.textContent = valueRef.current;
    });
  };

  return (
    <span
      className={`group/edit relative inline-flex max-w-full items-start gap-1.5 ${flash ? 'studio-flash' : ''}`}
    >
      <span
        ref={ref}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline={multiline}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        inputMode={inputMode}
        data-placeholder={placeholder}
        dir="auto"
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !(multiline && e.shiftKey)) {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          } else if (e.key === 'Escape') {
            e.currentTarget.textContent = value;
            (e.currentTarget as HTMLElement).blur();
          }
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain').replace(/\n+/g, ' ');
          document.execCommand('insertText', false, text);
        }}
        className={`studio-editable min-w-[2ch] cursor-text rounded-md px-1 outline-none transition-shadow focus:bg-white focus:shadow-[0_0_0_2px_var(--studio-accent,#2563EB)] ${className}`}
        style={style}
      >
        {value}
      </span>
      {hint && (
        <Pencil
          size={12}
          aria-hidden
          className="mt-[0.35em] shrink-0 text-[#94A3B8] opacity-60 transition-opacity group-focus-within/edit:opacity-0 group-hover/edit:opacity-100"
        />
      )}
    </span>
  );
}
