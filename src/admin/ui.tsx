import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconCheck, IconChevronDown, IconPlay, IconTrophy } from './icons';
import { STATUS_LABEL, type Status } from './data';

export function Card({ className = '', children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`a-card ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function Kpi({ icon, value, label, title }: { icon: ReactNode; value: ReactNode; label: string; title?: string }) {
  return (
    <div className="a-card a-kpi" title={title}>
      <div className="a-kpi__text">
        <div className="a-kpi__value">{value}</div>
        <div className="a-kpi__label">{label}</div>
      </div>
      <div className="a-kpi__icon">{icon}</div>
    </div>
  );
}

export function StatusBadge({ s }: { s: Status }) {
  return (
    <span className={`a-badge a-badge--${s}`}>
      {s === 'active' && <i className="a-badge__dot" />}
      {s === 'done' && <IconTrophy size={14} />}
      {s === 'progress' && <IconPlay size={13} />}
      {STATUS_LABEL[s]}
    </span>
  );
}

export type Option<T> = { value: T; label: string };

/** Button + popover list. Closes on outside click / Escape. */
export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  children,
  className = '',
  label,
  menuAlign = 'start',
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  /** button content; defaults to the selected option's label */
  children?: ReactNode;
  className?: string;
  label: string;
  menuAlign?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  const current = options.find((o) => o.value === value);
  return (
    <div className={`a-dd ${className}`} ref={ref}>
      <button
        type="button"
        className={`a-dd__btn${open ? ' is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        {children ?? <span>{current?.label}</span>}
        <IconChevronDown size={16} className="a-dd__chev" />
      </button>
      {open && (
        <ul className={`a-dd__menu a-dd__menu--${menuAlign}`} role="listbox" aria-label={label}>
          {options.map((o) => (
            <li key={String(o.value)}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <span>{o.label}</span>
                {o.value === value && <IconCheck size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
