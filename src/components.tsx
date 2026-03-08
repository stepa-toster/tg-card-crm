import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  type LeadStatus, ALL_STATUSES, STATUS_CONFIG, STATUS_CONFIG_DARK,
  type TgAccount,
} from "./data";

// ═══ STATUS BADGE ═══
export function StatusBadge({ status, dark }: { status: LeadStatus; dark?: boolean }) {
  const c = dark ? { ...STATUS_CONFIG[status], ...STATUS_CONFIG_DARK[status] } : STATUS_CONFIG[status];
  return (
    <span
      style={{ background: c.bg, color: c.color, fontSize: 12, fontWeight: 600 }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
    >
      <span style={{ background: c.dot, width: 6, height: 6, borderRadius: "50%", display: "inline-block" }} />
      {STATUS_CONFIG[status].label}
    </span>
  );
}

// ═══ STATUS DROPDOWN (PORTAL) ═══
export function StatusDropdown({
  status, onChange, dark
}: { status: LeadStatus; onChange: (s: LeadStatus) => void; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false });
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const rect = btnRef.current!.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setPos({
      top: spaceBelow > 320 ? rect.bottom + 4 : rect.top - 4,
      left: Math.min(rect.left, window.innerWidth - 200),
      openUp: spaceBelow <= 320,
    });
    setOpen(o => !o);
  }

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        const target = e.target as Node;
        const dropdown = document.querySelector("[data-status-portal]");
        if (dropdown && dropdown.contains(target)) return;
        if (btnRef.current && btnRef.current.contains(target)) return;
        setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  const c = dark ? { ...STATUS_CONFIG[status], ...STATUS_CONFIG_DARK[status] } : STATUS_CONFIG[status];
  return (
    <div data-dropdown className="inline-block">
      <button
        ref={btnRef}
        onMouseDown={handleOpen}
        style={{ background: c.bg, color: c.color, fontSize: 12, fontWeight: 600 }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
      >
        <span style={{ background: c.dot, width: 6, height: 6, borderRadius: "50%", display: "inline-block" }} />
        {STATUS_CONFIG[status].label}
        <span className="ml-0.5 text-[10px]">▼</span>
      </button>
      {open && createPortal(
        <div
          data-status-portal
          className="animate-scaleIn"
          style={{
            position: "fixed",
            top: pos.openUp ? "auto" : pos.top,
            bottom: pos.openUp ? `${window.innerHeight - pos.top}px` : "auto",
            left: pos.left,
            zIndex: 9999,
            minWidth: 180,
          }}
        >
          <div className="crm-card p-1 shadow-xl" style={{ borderRadius: 12 }}>
            {ALL_STATUSES.map(s => {
              const sc = dark ? { ...STATUS_CONFIG[s], ...STATUS_CONFIG_DARK[s] } : STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(s);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-80 transition-all text-left"
                  style={{
                    background: s === status ? sc.bg : "transparent",
                    color: sc.color,
                    fontSize: 13,
                    fontWeight: s === status ? 600 : 400,
                  }}
                >
                  <span style={{ background: sc.dot, width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} />
                  {STATUS_CONFIG[s].label}
                  {s === status && <span className="ml-auto">✓</span>}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ═══ LIMIT BAR ═══
export function LimitBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const clr = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: clr }} />
      </div>
      <span className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>{current}/{max}</span>
    </div>
  );
}

// ═══ MODAL ═══
export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 10000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onMouseDown={onClose}
    >
      <div
        className={`crm-card modal-sheet p-6 ${wide ? "max-w-2xl" : "max-w-md"} w-full max-h-[90vh] overflow-y-auto`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-main)" }}>{title}</h3>
          <button onClick={onClose} className="text-xl cursor-pointer hover:opacity-60" style={{ color: "var(--text-muted)" }}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ═══ DRAWER ═══
export function Drawer({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0"
      style={{ zIndex: 10000, background: "rgba(0,0,0,0.5)" }}
      onMouseDown={onClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 crm-card modal-sheet p-6 rounded-t-2xl max-h-[80vh] overflow-y-auto"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-main)" }}>{title}</h3>
          <button onClick={onClose} className="text-xl cursor-pointer hover:opacity-60" style={{ color: "var(--text-muted)" }}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ═══ INPUT ═══
export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label, className, ...rest } = props;
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-sub)" }}>{label}</label>}
      <input
        {...rest}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
        style={{
          background: "var(--bg-main)",
          color: "var(--text-main)",
          border: "1.5px solid var(--border)",
        }}
        onFocus={e => e.target.style.borderColor = "var(--accent)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

// ═══ TEXTAREA ═══
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const { label, className, ...rest } = props;
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-sub)" }}>{label}</label>}
      <textarea
        {...rest}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all"
        style={{
          background: "var(--bg-main)",
          color: "var(--text-main)",
          border: "1.5px solid var(--border)",
        }}
        rows={3}
        onFocus={e => e.target.style.borderColor = "var(--accent)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

// ═══ SELECT ═══
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const { label, className, children, ...rest } = props;
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-sub)" }}>{label}</label>}
      <select
        {...rest}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none cursor-pointer transition-all"
        style={{
          background: "var(--bg-main)",
          color: "var(--text-main)",
          border: "1.5px solid var(--border)",
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ═══ BUTTON ═══
const btnStyles: Record<string, { bg: string; color: string; hoverBg: string }> = {
  primary:   { bg: "#4f46e5", color: "#fff",     hoverBg: "#4338ca" },
  secondary: { bg: "var(--bg-main)", color: "var(--text-main)", hoverBg: "var(--border)" },
  danger:    { bg: "#ef4444", color: "#fff",     hoverBg: "#dc2626" },
  ghost:     { bg: "transparent", color: "var(--text-sub)", hoverBg: "var(--bg-main)" },
  success:   { bg: "#22c55e", color: "#fff",     hoverBg: "#16a34a" },
};

export function Btn({ variant = "primary", children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  const s = btnStyles[variant] || btnStyles.primary;
  return (
    <button
      {...rest}
      className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`}
      style={{ background: s.bg, color: s.color }}
      onMouseEnter={e => (e.currentTarget.style.background = s.hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.background = s.bg)}
    >
      {children}
    </button>
  );
}

// ═══ CARD ═══
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`crm-card p-4 ${className || ""}`}>{children}</div>;
}

// ═══ TOGGLE ═══
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full cursor-pointer transition-all"
      style={{ background: checked ? "#4f46e5" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

// ═══ COUNTDOWN ═══
export function Countdown({ dueAt }: { dueAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(dueAt).getTime() - now;
  const overdue = diff < 0;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const color = overdue ? "#ef4444" : diff < 3600000 ? "#f59e0b" : "#22c55e";
  return (
    <span className="font-mono text-sm font-bold" style={{ color }}>
      {overdue ? "−" : ""}{h > 0 ? `${h}ч ` : ""}{m}м {s}с
    </span>
  );
}

// ═══ TOAST ═══
export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return createPortal(
    <div
      className="fixed top-4 right-4 crm-card px-4 py-3 animate-slideUp shadow-xl"
      style={{ zIndex: 99999, maxWidth: 360, borderRadius: 12 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: "var(--text-main)" }}>{message}</span>
        <button onClick={onClose} className="text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>✕</button>
      </div>
    </div>,
    document.body
  );
}

// ═══ EMPTY STATE ═══
export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
      <span className="text-5xl mb-3">{icon}</span>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{text}</p>
    </div>
  );
}

// ═══ ACCOUNT CHECKBOX LIST ═══
export function AccountCheckboxList({
  accounts, selected, onChange
}: { accounts: TgAccount[]; selected: number[]; onChange: (ids: number[]) => void }) {
  return (
    <div className="space-y-1">
      {accounts.map(acc => (
        <label key={acc.id} className="flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer hover:opacity-80" style={{ color: "var(--text-main)" }}>
          <input
            type="checkbox"
            checked={selected.includes(acc.id)}
            onChange={() => onChange(
              selected.includes(acc.id)
                ? selected.filter(id => id !== acc.id)
                : [...selected, acc.id]
            )}
            className="accent-indigo-600"
          />
          <span className="text-sm">{acc.label}</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{acc.phone}</span>
        </label>
      ))}
    </div>
  );
}
