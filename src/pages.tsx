import React, { useState, useEffect, useRef } from "react";
import {
  type LeadStatus, ALL_STATUSES, STATUS_CONFIG,
  type TgAccount, type Offer, type LkCabinet, type Lead, type ChatMessage,
  type Task, type QuickReply, type BalanceRecord, type PartnerNetwork, type CRMUser,
  hashPassword,
} from "./data";
import {
  StatusBadge, StatusDropdown, LimitBar, Modal, Drawer, Input, Textarea, Select, Btn,
  Card, Toggle, Countdown, Empty, AccountCheckboxList,
} from "./components";

// ═══════════════════════════════════════════
// LEADS PAGE
// ═══════════════════════════════════════════
export function LeadsPage({
  leads, setLeads, accounts, offers, cabinets, dark, onOpenChat,
}: {
  leads: Lead[]; setLeads: (l: Lead[]) => void;
  accounts: TgAccount[]; offers: Offer[]; cabinets: LkCabinet[];
  dark: boolean; onOpenChat: (leadId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [sortBy, setSortBy] = useState<string>("delivery_date");
  const [sortAsc, setSortAsc] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAccount, setFilterAccount] = useState<string>("");
  const [filterOffer, setFilterOffer] = useState<string>("");
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const tomorrowLeads = leads.filter(l => l.delivery_date === tomorrowStr);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortAsc(!sortAsc);
    else { setSortBy(field); setSortAsc(true); }
  };

  let filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const match = !q || l.full_name.toLowerCase().includes(q) || l.tg_username.toLowerCase().includes(q) || l.phone.includes(q);
    const statusMatch = !filterStatus || l.status === filterStatus;
    const accMatch = !filterAccount || l.tg_account_id === Number(filterAccount);
    const offerMatch = !filterOffer || l.offer_id === Number(filterOffer);
    return match && statusMatch && accMatch && offerMatch;
  });

  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "delivery_date") {
      const da = a.delivery_date || "9999";
      const db = b.delivery_date || "9999";
      cmp = da.localeCompare(db);
    } else if (sortBy === "created_at") {
      cmp = a.created_at.localeCompare(b.created_at);
    } else if (sortBy === "full_name") {
      cmp = a.full_name.localeCompare(b.full_name);
    } else if (sortBy === "status") {
      cmp = ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status);
    }
    return sortAsc ? cmp : -cmp;
  });

  const updateLeadStatus = (id: number, status: LeadStatus) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status, updated_at: new Date().toISOString() } : l));
  };

  const deleteLead = (id: number) => {
    if (confirm("Удалить лида?")) setLeads(leads.filter(l => l.id !== id));
  };

  const saveLead = (lead: Lead) => {
    const exists = leads.find(l => l.id === lead.id);
    if (exists) setLeads(leads.map(l => l.id === lead.id ? { ...lead, updated_at: new Date().toISOString() } : l));
    else setLeads([...leads, { ...lead, id: Math.max(0, ...leads.map(l => l.id)) + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
    setEditLead(null);
    setShowAddModal(false);
  };

  const sortIcon = (field: string) => sortBy === field ? (sortAsc ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Banner */}
      {!dismissedBanner && tomorrowLeads.length > 0 && (
        <div className="crm-card p-4 flex items-center justify-between animate-popIn" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div>
            <span className="text-lg mr-2">📅</span>
            <span className="font-semibold" style={{ color: "var(--text-main)" }}>
              Доставка завтра! ({tomorrowLeads.length} {tomorrowLeads.length === 1 ? "лид" : "лидов"})
            </span>
            <span className="text-sm ml-2" style={{ color: "var(--text-sub)" }}>
              {tomorrowLeads.map(l => l.full_name).join(", ")}
            </span>
          </div>
          <button onClick={() => setDismissedBanner(true)} className="cursor-pointer text-lg" style={{ color: "var(--text-muted)" }}>✕</button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="🔍 Поиск по имени, username, телефону..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Btn variant="secondary" onClick={() => setFiltersOpen(true)}>🔽 Фильтры</Btn>
        <Btn variant="secondary" onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}>
          {viewMode === "table" ? "🃏 Карточки" : "📋 Таблица"}
        </Btn>
        <Btn onClick={() => { setEditLead(null); setShowAddModal(true); }}>+ Лид</Btn>
      </div>

      {/* Sort buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "delivery_date", label: "📅 Доставка" },
          { key: "created_at", label: "🕐 Создан" },
          { key: "status", label: "📊 Статус" },
          { key: "full_name", label: "👤 Имя" },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => handleSort(s.key)}
            className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all"
            style={{
              background: sortBy === s.key ? "var(--accent)" : "var(--bg-card)",
              color: sortBy === s.key ? "#fff" : "var(--text-sub)",
              border: "1px solid var(--border)",
            }}
          >
            {s.label}{sortIcon(s.key)}
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <Empty icon="📭" text="Нет лидов" />
      ) : viewMode === "table" ? (
        <div className="crm-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--border)" }}>
                <th className="text-left p-3 font-semibold" style={{ color: "var(--text-sub)" }}>Имя</th>
                <th className="text-left p-3 font-semibold" style={{ color: "var(--text-sub)" }}>Username</th>
                <th className="text-left p-3 font-semibold" style={{ color: "var(--text-sub)" }}>Статус</th>
                <th className="text-left p-3 font-semibold" style={{ color: "var(--text-sub)" }}>Оффер</th>
                <th className="text-left p-3 font-semibold" style={{ color: "var(--text-sub)" }}>Доставка</th>
                <th className="text-left p-3 font-semibold" style={{ color: "var(--text-sub)" }}>Аккаунт</th>
                <th className="text-right p-3 font-semibold" style={{ color: "var(--text-sub)" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} className={i % 2 === 0 ? "table-row-even" : ""} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-3">
                    <div className="font-medium" style={{ color: "var(--text-main)" }}>{l.full_name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{l.phone}</div>
                  </td>
                  <td className="p-3 text-xs" style={{ color: "var(--text-sub)" }}>@{l.tg_username}</td>
                  <td className="p-3"><StatusDropdown status={l.status} onChange={s => updateLeadStatus(l.id, s)} dark={dark} /></td>
                  <td className="p-3 text-xs" style={{ color: "var(--text-sub)" }}>{offers.find(o => o.id === l.offer_id)?.name || "—"}</td>
                  <td className="p-3 text-xs" style={{ color: l.delivery_date ? "var(--text-main)" : "var(--text-muted)" }}>
                    {l.delivery_date || "—"}
                  </td>
                  <td className="p-3 text-xs" style={{ color: "var(--text-sub)" }}>{accounts.find(a => a.id === l.tg_account_id)?.label || "—"}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onOpenChat(l.id)} className="px-2 py-1 rounded-lg text-xs cursor-pointer" style={{ background: "var(--bg-main)", color: "var(--text-sub)" }}>💬</button>
                      <button onClick={() => setEditLead(l)} className="px-2 py-1 rounded-lg text-xs cursor-pointer" style={{ background: "var(--bg-main)", color: "var(--text-sub)" }}>✏️</button>
                      <button onClick={() => deleteLead(l.id)} className="px-2 py-1 rounded-lg text-xs cursor-pointer" style={{ background: "#fee2e2", color: "#b91c1c" }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(l => (
            <Card key={l.id} className="animate-fadeIn">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#4f46e5" }}>
                    {l.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: "var(--text-main)" }}>{l.full_name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{l.tg_username}</div>
                  </div>
                </div>
                <StatusDropdown status={l.status} onChange={s => updateLeadStatus(l.id, s)} dark={dark} />
              </div>
              <div className="space-y-1 text-xs mb-3" style={{ color: "var(--text-sub)" }}>
                <div>📞 {l.phone}</div>
                <div>💳 {offers.find(o => o.id === l.offer_id)?.name || "—"}</div>
                {l.delivery_date && <div>📅 {l.delivery_date}</div>}
                <div>📱 {accounts.find(a => a.id === l.tg_account_id)?.label || "—"}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onOpenChat(l.id)} className="flex-1 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: "var(--bg-main)", color: "var(--text-sub)" }}>💬 Чат</button>
                <button onClick={() => setEditLead(l)} className="flex-1 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: "var(--bg-main)", color: "var(--text-sub)" }}>✏️ Ред.</button>
                <button onClick={() => deleteLead(l.id)} className="py-1.5 px-2 rounded-lg text-xs cursor-pointer" style={{ background: "#fee2e2", color: "#b91c1c" }}>🗑</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters Drawer */}
      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Фильтры">
        <div className="space-y-4">
          <Select label="Статус" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Все</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </Select>
          <Select label="TG Аккаунт" value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
            <option value="">Все</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </Select>
          <Select label="Оффер" value={filterOffer} onChange={e => setFilterOffer(e.target.value)}>
            <option value="">Все</option>
            {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
          <div className="flex gap-2">
            <Btn onClick={() => { setFilterStatus(""); setFilterAccount(""); setFilterOffer(""); }} variant="secondary">Сбросить</Btn>
            <Btn onClick={() => setFiltersOpen(false)}>Применить</Btn>
          </div>
        </div>
      </Drawer>

      {/* Edit/Add Modal */}
      <LeadFormModal
        open={showAddModal || editLead !== null}
        onClose={() => { setEditLead(null); setShowAddModal(false); }}
        lead={editLead}
        accounts={accounts}
        offers={offers}
        cabinets={cabinets}
        onSave={saveLead}
      />
    </div>
  );
}

function LeadFormModal({ open, onClose, lead, accounts, offers, cabinets, onSave }: {
  open: boolean; onClose: () => void; lead: Lead | null;
  accounts: TgAccount[]; offers: Offer[]; cabinets: LkCabinet[];
  onSave: (l: Lead) => void;
}) {
  const empty: Lead = {
    id: 0, tg_user_id: "", tg_username: "", full_name: "", phone: "", source: "",
    tg_account_id: accounts[0]?.id || 1, offer_id: offers[0]?.id || 1, cabinet_id: null,
    status: "новый", delivery_date: "", delivery_address: "",
    is_paid: false, paid_date: "", reward_paid: 0, in_tg_folder: false, chat_deleted: false,
    deleted_by: "", notes: "", created_at: "", updated_at: "",
  };
  const [form, setForm] = useState<Lead>(lead || empty);
  useEffect(() => { setForm(lead || empty); }, [lead, open]);

  const upd = (k: string, v: string | number | boolean | null) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title={lead ? "Редактировать лида" : "Новый лид"} wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="ФИО" value={form.full_name} onChange={e => upd("full_name", e.target.value)} />
        <Input label="TG Username" value={form.tg_username} onChange={e => upd("tg_username", e.target.value)} />
        <Input label="Телефон" value={form.phone} onChange={e => upd("phone", e.target.value)} />
        <Input label="Источник" value={form.source} onChange={e => upd("source", e.target.value)} />
        <Select label="TG Аккаунт" value={form.tg_account_id} onChange={e => upd("tg_account_id", Number(e.target.value))}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </Select>
        <Select label="Оффер" value={form.offer_id} onChange={e => upd("offer_id", Number(e.target.value))}>
          {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
        <Input label="Дата доставки" type="date" value={form.delivery_date} onChange={e => upd("delivery_date", e.target.value)} />
        <Input label="Адрес доставки" value={form.delivery_address} onChange={e => upd("delivery_address", e.target.value)} />
      </div>
      <Textarea label="Заметки" className="mt-3" value={form.notes} onChange={e => upd("notes", e.target.value)} />
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="secondary" onClick={onClose}>Отмена</Btn>
        <Btn onClick={() => onSave(form)}>Сохранить</Btn>
      </div>
    </Modal>
  );
}


// ═══════════════════════════════════════════
// CHAT PAGE
// ═══════════════════════════════════════════
export function ChatPage({
  leads, setLeads, accounts, messages, setMessages, quickReplies, dark, initialLeadId, onSendMessage,
}: {
  leads: Lead[]; setLeads: (l: Lead[]) => void;
  accounts: TgAccount[];
  messages: ChatMessage[]; setMessages: (m: ChatMessage[]) => void;
  quickReplies: QuickReply[]; dark: boolean;
  initialLeadId?: number | null;
  onSendMessage?: (text: string, contact: string) => void;
  })
  {
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(initialLeadId || null);
  const [chatSearch, setChatSearch] = useState("");
  const [chatFilterStatus, setChatFilterStatus] = useState("");
  const [chatFilterAccount, setChatFilterAccount] = useState("");
  const [msgText, setMsgText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [qrFilter, setQrFilter] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialLeadId) { setSelectedLeadId(initialLeadId); setMobileShowChat(true); }
  }, [initialLeadId]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedLeadId, messages]);

  const filteredLeads = leads.filter(l => {
    const q = chatSearch.toLowerCase();
    const match = !q || l.full_name.toLowerCase().includes(q) || l.tg_username.toLowerCase().includes(q);
    const statusMatch = !chatFilterStatus || l.status === chatFilterStatus;
    const accMatch = !chatFilterAccount || l.tg_account_id === Number(chatFilterAccount);
    return match && statusMatch && accMatch;
  });

  const selectedLead = leads.find(l => l.id === selectedLeadId) || null;
  const leadMessages = messages.filter(m => m.lead_id === selectedLeadId).sort((a, b) => a.sent_at.localeCompare(b.sent_at));

  const getLastMessage = (leadId: number) => {
    const msgs = messages.filter(m => m.lead_id === leadId);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

   const sendMessage = () => {
    if (!msgText.trim() || !selectedLead) return;

    // 👇 НОВАЯ ЛОГИКА ОТПРАВКИ 👇
    if (onSendMessage) {
       const contact = selectedLead.tg_username 
          ? selectedLead.tg_username.replace('@', '') 
          : selectedLead.phone;
          
       onSendMessage(msgText.trim(), contact);
       setMsgText("");
       setShowQuickReplies(false);
       return;
    }

  const handleInputChange = (val: string) => {
    setMsgText(val);
    if (val.startsWith("/")) {
      setShowQuickReplies(true);
      setQrFilter(val.slice(1));
    } else {
      setShowQuickReplies(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showQuickReplies) return;
      sendMessage();
    }
    if (e.key === "Escape") {
      setShowQuickReplies(false);
    }
  };

  const selectQuickReply = (text: string) => {
    setMsgText(text);
    setShowQuickReplies(false);
    inputRef.current?.focus();
  };

  const updateLeadStatus = (id: number, status: LeadStatus) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status, updated_at: new Date().toISOString() } : l));
  };

  const filteredQR = quickReplies.filter(qr => qr.is_active && (!qrFilter || qr.shortcut.includes(qrFilter) || qr.text.toLowerCase().includes(qrFilter.toLowerCase())));

  // Mobile layout
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="flex h-[calc(100vh-72px)] md:h-[calc(100vh-32px)] animate-fadeIn" style={{ borderRadius: 16, overflow: "hidden" }}>
      {/* Left panel - contacts list */}
      <div
        className={`${isMobile && mobileShowChat ? "hidden" : "flex"} flex-col w-full md:w-80 md:flex`}
        style={{ borderRight: "1.5px solid var(--border)", background: "var(--bg-card)" }}
      >
        <div className="p-3 space-y-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <Input placeholder="🔍 Поиск..." value={chatSearch} onChange={e => setChatSearch(e.target.value)} />
          <div className="flex gap-2">
            <select
              className="flex-1 px-2 py-1 rounded-lg text-xs"
              style={{ background: "var(--bg-main)", color: "var(--text-sub)", border: "1px solid var(--border)" }}
              value={chatFilterStatus}
              onChange={e => setChatFilterStatus(e.target.value)}
            >
              <option value="">Все статусы</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
            <select
              className="flex-1 px-2 py-1 rounded-lg text-xs"
              style={{ background: "var(--bg-main)", color: "var(--text-sub)", border: "1px solid var(--border)" }}
              value={chatFilterAccount}
              onChange={e => setChatFilterAccount(e.target.value)}
            >
              <option value="">Все акки</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <Empty icon="🔍" text="Нет контактов" />
          ) : (
            filteredLeads.map(l => {
              const lastMsg = getLastMessage(l.id);
              const acc = accounts.find(a => a.id === l.tg_account_id);
              return (
                <div
                  key={l.id}
                  onClick={() => { setSelectedLeadId(l.id); setMobileShowChat(true); }}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all"
                  style={{
                    background: selectedLeadId === l.id ? "var(--bg-main)" : "transparent",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: "#4f46e5" }}>
                    {l.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate" style={{ color: "var(--text-main)" }}>{l.full_name}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {lastMsg ? new Date(lastMsg.sent_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StatusBadge status={l.status} dark={dark} />
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {lastMsg ? lastMsg.text : "Нет сообщений"}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      📱 {acc?.label || "—"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel - chat */}
      <div
        className={`${isMobile && !mobileShowChat ? "hidden" : "flex"} flex-col flex-1 md:flex`}
        style={{ background: "var(--bg-main)" }}
      >
        {!selectedLead ? (
          <div className="flex-1 flex items-center justify-center">
            <Empty icon="💬" text="Выберите контакт" />
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--bg-card)", borderBottom: "1.5px solid var(--border)" }}>
              {isMobile && (
                <button onClick={() => setMobileShowChat(false)} className="text-lg cursor-pointer" style={{ color: "var(--text-sub)" }}>←</button>
              )}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#4f46e5" }}>
                {selectedLead.full_name.charAt(0)}
              </div>
              <div className="flex-1">
                <a href={`https://t.me/${selectedLead.tg_username}`} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline" style={{ color: "var(--text-main)" }}>
                  {selectedLead.full_name}
                </a>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{selectedLead.tg_username}</div>
              </div>
              <StatusDropdown status={selectedLead.status} onChange={s => updateLeadStatus(selectedLead.id, s)} dark={dark} />
              <a
                href={`https://t.me/${selectedLead.tg_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-lg text-xs cursor-pointer"
                style={{ background: "var(--bg-main)", color: "var(--text-sub)", textDecoration: "none" }}
              >
                TG ↗
              </a>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {leadMessages.map(m => {
                const acc = accounts.find(a => a.id === m.tg_account_id);
                return (
                  <div key={m.id} className={`flex ${m.direction === "outgoing" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.direction === "incoming" ? "chat-bubble-in" : "chat-bubble-out"}`}
                    >
                      <div>{m.text}</div>
                      <div className={`text-[10px] mt-1 ${m.direction === "outgoing" ? "text-indigo-200" : ""}`} style={m.direction === "incoming" ? { color: "var(--text-muted)" } : {}}>
                        {new Date(m.sent_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                        {m.direction === "outgoing" && acc && <span className="ml-1">📱 {acc.label}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div className="relative px-4 py-3" style={{ background: "var(--bg-card)", borderTop: "1.5px solid var(--border)" }}>
              {showQuickReplies && filteredQR.length > 0 && (
                <div
                  className="absolute bottom-full left-4 right-4 crm-card p-2 mb-2 max-h-48 overflow-y-auto animate-scaleIn"
                  style={{ borderRadius: 12 }}
                >
                  {filteredQR.map(qr => (
                    <button
                      key={qr.id}
                      onMouseDown={(e) => { e.preventDefault(); selectQuickReply(qr.text); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-all hover:opacity-80"
                      style={{ color: "var(--text-main)" }}
                    >
                      <span className="font-semibold text-indigo-500">/{qr.shortcut}</span>
                      <span className="ml-2" style={{ color: "var(--text-sub)" }}>{qr.text.slice(0, 60)}...</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={msgText}
                  onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Сообщение... (/ для быстрых ответов)"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-main)", color: "var(--text-main)", border: "1.5px solid var(--border)" }}
                />
                <Btn onClick={sendMessage} disabled={!msgText.trim()}>↑</Btn>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
  }


// ═══════════════════════════════════════════
// BALANCE PAGE
// ═══════════════════════════════════════════
export function BalancePage({
  accounts, offers, leads, balanceHistory,
}: {
  accounts: TgAccount[]; offers: Offer[]; leads: Lead[];
  balanceHistory: BalanceRecord[];
}) {
  const totalEarned = accounts.reduce((s, a) => s + a.total_earned, 0);
  const totalHold = accounts.reduce((s, a) => s + a.hold_balance, 0);
  const totalWithdrawn = balanceHistory.filter(b => b.type === "withdrawal").reduce((s, b) => s + Math.abs(b.amount), 0);

  const offerStats = offers.map(o => ({
    name: o.name,
    count: leads.filter(l => l.offer_id === o.id).length,
    earned: leads.filter(l => l.offer_id === o.id && l.is_paid).reduce((s, l) => s + l.reward_paid, 0),
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="animate-fadeIn delay-1">
          <div className="text-sm" style={{ color: "var(--text-sub)" }}>💰 Заработано</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "#22c55e" }}>{totalEarned.toLocaleString()} ₽</div>
        </Card>
        <Card className="animate-fadeIn delay-2">
          <div className="text-sm" style={{ color: "var(--text-sub)" }}>⏳ В холде</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "#f59e0b" }}>{totalHold.toLocaleString()} ₽</div>
        </Card>
        <Card className="animate-fadeIn delay-3">
          <div className="text-sm" style={{ color: "var(--text-sub)" }}>📤 Выплачено</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "#3b82f6" }}>{totalWithdrawn.toLocaleString()} ₽</div>
        </Card>
      </div>

      {/* По аккаунтам */}
      <Card>
        <h3 className="font-bold mb-3" style={{ color: "var(--text-main)" }}>📱 По аккаунтам</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--border)" }}>
              <th className="text-left p-2" style={{ color: "var(--text-sub)" }}>Аккаунт</th>
              <th className="text-right p-2" style={{ color: "var(--text-sub)" }}>Лидов</th>
              <th className="text-right p-2" style={{ color: "var(--text-sub)" }}>Заработано</th>
              <th className="text-right p-2" style={{ color: "var(--text-sub)" }}>Холд</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(a => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="p-2" style={{ color: "var(--text-main)" }}>{a.label}</td>
                <td className="p-2 text-right" style={{ color: "var(--text-sub)" }}>{a.leads_count}</td>
                <td className="p-2 text-right" style={{ color: "#22c55e" }}>{a.total_earned.toLocaleString()} ₽</td>
                <td className="p-2 text-right" style={{ color: "#f59e0b" }}>{a.hold_balance.toLocaleString()} ₽</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* По офферам */}
      <Card>
        <h3 className="font-bold mb-3" style={{ color: "var(--text-main)" }}>💳 По офферам</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--border)" }}>
              <th className="text-left p-2" style={{ color: "var(--text-sub)" }}>Оффер</th>
              <th className="text-right p-2" style={{ color: "var(--text-sub)" }}>Лидов</th>
              <th className="text-right p-2" style={{ color: "var(--text-sub)" }}>Заработано</th>
            </tr>
          </thead>
          <tbody>
            {offerStats.map(o => (
              <tr key={o.name} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="p-2" style={{ color: "var(--text-main)" }}>{o.name}</td>
                <td className="p-2 text-right" style={{ color: "var(--text-sub)" }}>{o.count}</td>
                <td className="p-2 text-right" style={{ color: "#22c55e" }}>{o.earned.toLocaleString()} ₽</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* История */}
      <Card>
        <h3 className="font-bold mb-3" style={{ color: "var(--text-main)" }}>📋 История операций</h3>
        <div className="space-y-2">
          {balanceHistory.map(b => {
            const acc = accounts.find(a => a.id === b.tg_account_id);
            return (
              <div key={b.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div className="text-sm" style={{ color: "var(--text-main)" }}>{b.description}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {acc?.label} • {new Date(b.created_at).toLocaleDateString("ru")}
                  </div>
                </div>
                <span className="font-bold text-sm" style={{ color: b.amount > 0 ? "#22c55e" : "#ef4444" }}>
                  {b.amount > 0 ? "+" : ""}{b.amount.toLocaleString()} ₽
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}


// ═══════════════════════════════════════════
// TASKS PAGE
// ═══════════════════════════════════════════
export function TasksPage({
  tasks, setTasks, leads, accounts,
}: {
  tasks: Task[]; setTasks: (t: Task[]) => void;
  leads: Lead[]; accounts: TgAccount[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [newAccountId, setNewAccountId] = useState(accounts[0]?.id || 1);
  const [newNotes, setNewNotes] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [leadSearch, setLeadSearch] = useState("");

  const activeTasks = tasks.filter(t => !t.is_done).sort((a, b) => a.due_at.localeCompare(b.due_at));
  const doneTasks = tasks.filter(t => t.is_done);

  const completeTask = (id: number) => setTasks(tasks.map(t => t.id === id ? { ...t, is_done: true } : t));
  const deleteTask = (id: number) => setTasks(tasks.filter(t => t.id !== id));

  const addTask = () => {
    if (!newTitle.trim()) return;
    const newTask: Task = {
      id: Math.max(0, ...tasks.map(t => t.id)) + 1,
      title: newTitle,
      lead_ids: selectedLeadIds,
      recipients_count: selectedLeadIds.length,
      due_at: newDueAt || new Date(Date.now() + 3600000).toISOString(),
      is_done: false,
      tg_account_id: newAccountId,
      notes: newNotes,
      created_at: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
    setNewTitle("");
    setNewDueAt("");
    setNewNotes("");
    setSelectedLeadIds([]);
    setShowAdd(false);
  };

  const filteredLeads = leads.filter(l => {
    const q = leadSearch.toLowerCase();
    return !q || l.full_name.toLowerCase().includes(q) || l.tg_username.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-main)" }}>✅ Задачи</h2>
        <Btn onClick={() => setShowAdd(true)}>+ Задача</Btn>
      </div>

      {activeTasks.length === 0 ? (
        <Empty icon="🎉" text="Нет активных задач" />
      ) : (
        <div className="space-y-3">
          {activeTasks.map(t => {
            const acc = accounts.find(a => a.id === t.tg_account_id);
            const taskLeads = leads.filter(l => t.lead_ids.includes(l.id));
            return (
              <Card key={t.id} className="animate-slideIn">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold" style={{ color: "var(--text-main)" }}>{t.title}</div>
                    <div className="text-xs mt-1 space-y-0.5" style={{ color: "var(--text-sub)" }}>
                      <div>📱 {acc?.label || "—"}</div>
                      {taskLeads.length > 0 && <div>👥 {taskLeads.map(l => l.full_name).join(", ")}</div>}
                      {t.notes && <div>📝 {t.notes}</div>}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <Countdown dueAt={t.due_at} />
                    <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                      {new Date(t.due_at).toLocaleString("ru", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Btn variant="success" onClick={() => completeTask(t.id)} className="text-xs !py-1">✓ Выполнить</Btn>
                  <Btn variant="danger" onClick={() => deleteTask(t.id)} className="text-xs !py-1">🗑 Удалить</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {doneTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(!showDone)}
            className="text-sm cursor-pointer flex items-center gap-1"
            style={{ color: "var(--text-muted)" }}
          >
            {showDone ? "▼" : "▶"} Выполненные ({doneTasks.length})
          </button>
          {showDone && (
            <div className="space-y-2 mt-2">
              {doneTasks.map(t => (
                <Card key={t.id} className="opacity-60">
                  <div className="flex items-center justify-between">
                    <span className="line-through text-sm" style={{ color: "var(--text-sub)" }}>{t.title}</span>
                    <Btn variant="ghost" onClick={() => deleteTask(t.id)} className="text-xs">🗑</Btn>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новая задача" wide>
        <div className="space-y-3">
          <Input label="Название" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <Input label="Дата и время" type="datetime-local" value={newDueAt} onChange={e => setNewDueAt(e.target.value)} />
          <Select label="TG Аккаунт" value={newAccountId} onChange={e => setNewAccountId(Number(e.target.value))}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </Select>
          <Textarea label="Заметки" value={newNotes} onChange={e => setNewNotes(e.target.value)} />
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-sub)" }}>Лиды</label>
            <Input placeholder="Поиск лидов..." value={leadSearch} onChange={e => setLeadSearch(e.target.value)} className="mb-2" />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredLeads.map(l => (
                <label key={l.id} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-main)" }}>
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.includes(l.id)}
                    onChange={() => {
                      setSelectedLeadIds(
                        selectedLeadIds.includes(l.id)
                          ? selectedLeadIds.filter(id => id !== l.id)
                          : [...selectedLeadIds, l.id]
                      );
                    }}
                    className="accent-indigo-600"
                  />
                  {l.full_name} (@{l.tg_username})
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="secondary" onClick={() => setShowAdd(false)}>Отмена</Btn>
          <Btn onClick={addTask}>Создать</Btn>
        </div>
      </Modal>
    </div>
  );
}


// ═══════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════
export function SettingsPage({
  offers, setOffers, accounts, setAccounts, partnerNetworks, setPartnerNetworks,
  cabinets, setCabinets, quickReplies, setQuickReplies,
  users, setUsers, dark,
}: {
  offers: Offer[]; setOffers: (o: Offer[]) => void;
  accounts: TgAccount[]; setAccounts: (a: TgAccount[]) => void;
  partnerNetworks: PartnerNetwork[]; setPartnerNetworks: (p: PartnerNetwork[]) => void;
  cabinets: LkCabinet[]; setCabinets: (c: LkCabinet[]) => void;
  quickReplies: QuickReply[]; setQuickReplies: (q: QuickReply[]) => void;
  users: CRMUser[]; setUsers: (u: CRMUser[]) => void;
  dark: boolean;
}) {
  const [tab, setTab] = useState<"offers" | "accounts" | "partners" | "team" | "deploy">("offers");
  const tabs = [
    { key: "offers" as const, label: "💳 Офферы" },
    { key: "accounts" as const, label: "📱 Аккаунты" },
    { key: "partners" as const, label: "🤝 Партнёрки" },
    { key: "team" as const, label: "👥 Команда" },
    { key: "deploy" as const, label: "🚀 Деплой & TG" },
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all"
            style={{
              background: tab === t.key ? "#4f46e5" : "var(--bg-card)",
              color: tab === t.key ? "#fff" : "var(--text-sub)",
              border: `1.5px solid ${tab === t.key ? "#4f46e5" : "var(--border)"}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "offers" && <OffersTab offers={offers} setOffers={setOffers} cabinets={cabinets} setCabinets={setCabinets} />}
      {tab === "accounts" && <AccountsTab accounts={accounts} setAccounts={setAccounts} />}
      {tab === "partners" && <PartnersTab networks={partnerNetworks} setNetworks={setPartnerNetworks} />}
      {tab === "team" && <UsersAdminPanel accounts={accounts} users={users} setUsers={setUsers} />}
      {tab === "deploy" && <DeployGuideTab />}
    </div>
  );
}

// ═══ DEPLOY & TG GUIDE TAB ═══
function DeployGuideTab() {
  const [section, setSection] = useState<"deploy" | "tg" | "code">("deploy");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "deploy" as const, label: "🌐 Бесплатный деплой" },
          { key: "tg" as const, label: "🤖 Подключение TG" },
          { key: "code" as const, label: "💻 Добавить аккаунт в код" },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
            style={{
              background: section === s.key ? "#4f46e5" : "var(--bg-card)",
              color: section === s.key ? "#fff" : "var(--text-sub)",
              border: `1px solid ${section === s.key ? "#4f46e5" : "var(--border)"}`,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "deploy" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-lg mb-3" style={{ color: "var(--text-main)" }}>🚀 Бесплатный деплой на Vercel</h3>
            <div className="space-y-4 text-sm" style={{ color: "var(--text-sub)" }}>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #4f46e5" }}>
                <div className="font-bold mb-1" style={{ color: "var(--text-main)" }}>Шаг 1: Создать GitHub репозиторий</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Зайди на <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">github.com</a> → зарегистрируйся (бесплатно)</li>
                  <li>Нажми <strong>"New repository"</strong> (зелёная кнопка)</li>
                  <li>Назови: <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>tg-card-crm</code></li>
                  <li>Выбери <strong>Private</strong> (приватный)</li>
                  <li>Нажми <strong>"Create repository"</strong></li>
                </ol>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #22c55e" }}>
                <div className="font-bold mb-1" style={{ color: "var(--text-main)" }}>Шаг 2: Загрузить код</div>
                <div className="mb-2">Установи Git, затем в терминале:</div>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "var(--bg-main)", color: "var(--text-main)" }}>
{`# Перейди в папку проекта
cd tg-card-crm

# Инициализируй git
git init
git add .
git commit -m "Initial commit"

# Подключи к GitHub (замени USERNAME)
git remote add origin https://github.com/USERNAME/tg-card-crm.git
git branch -M main
git push -u origin main`}
                </pre>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #f59e0b" }}>
                <div className="font-bold mb-1" style={{ color: "var(--text-main)" }}>Шаг 3: Деплой на Vercel (бесплатно)</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Зайди на <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">vercel.com</a> → войди через GitHub</li>
                  <li>Нажми <strong>"Add New Project"</strong></li>
                  <li>Выбери свой репозиторий <strong>tg-card-crm</strong></li>
                  <li>Framework: <strong>Vite</strong> (определится автоматически)</li>
                  <li>Нажми <strong>"Deploy"</strong></li>
                  <li>Через ~1 минуту получишь ссылку вида <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>https://tg-card-crm.vercel.app</code></li>
                </ol>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #8b5cf6" }}>
                <div className="font-bold mb-1" style={{ color: "var(--text-main)" }}>Альтернатива: Netlify (тоже бесплатно)</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Зайди на <a href="https://netlify.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">netlify.com</a> → войди через GitHub</li>
                  <li>Нажми <strong>"Add new site" → "Import from Git"</strong></li>
                  <li>Build command: <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>npm run build</code></li>
                  <li>Publish directory: <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>dist</code></li>
                </ol>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #3b82f6" }}>
                <div className="font-bold mb-1" style={{ color: "var(--text-main)" }}>Альтернатива: Локальный запуск (без интернета)</div>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "var(--bg-main)", color: "var(--text-main)" }}>
{`# Установи Node.js с https://nodejs.org (бесплатно)
# Потом в терминале:

npm install        # установить зависимости
npm run dev        # запустить (откроется http://localhost:5173)

# Вход: admin / admin123`}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      )}

      {section === "tg" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-lg mb-3" style={{ color: "var(--text-main)" }}>🤖 Подключение Telegram аккаунта</h3>
            <div className="space-y-4 text-sm" style={{ color: "var(--text-sub)" }}>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #ef4444" }}>
                <div className="font-bold mb-2" style={{ color: "#ef4444" }}>⚠️ ВАЖНО: Как это работает</div>
                <p>CRM сама <strong>НЕ отправляет сообщения в Telegram</strong> — для этого нужен <strong>бэкенд (сервер)</strong>. Варианты:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Вариант 1:</strong> Telegram Bot API (бесплатно, но от имени бота)</li>
                  <li><strong>Вариант 2:</strong> Telegram User API через Telethon/Pyrogram (от имени аккаунта, нужен VPS)</li>
                  <li><strong>Вариант 3:</strong> Ручной режим (используй CRM как записную книжку, пиши в TG сам)</li>
                </ul>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #22c55e" }}>
                <div className="font-bold mb-2" style={{ color: "var(--text-main)" }}>✅ Вариант 1: Telegram Bot (бесплатно, проще всего)</div>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Открой <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">@BotFather</a> в Telegram</li>
                  <li>Отправь <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>/newbot</code></li>
                  <li>Придумай имя и username (например: <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>MyCardCRM_bot</code>)</li>
                  <li>Получишь <strong>токен</strong>: <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>123456:ABC-DEF1234...</code></li>
                  <li>Создай бэкенд (см. код ниже)</li>
                </ol>

                <div className="mt-3">
                  <div className="font-semibold mb-1" style={{ color: "var(--text-main)" }}>Бэкенд на Python (бесплатно на Render.com):</div>
                  <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "var(--bg-main)", color: "var(--text-main)" }}>
{`# bot_server.py — бесплатный бэкенд
# pip install python-telegram-bot flask flask-cors

from flask import Flask, request, jsonify
from flask_cors import CORS
import telegram
import asyncio

app = Flask(__name__)
CORS(app)

BOT_TOKEN = "ВАШ_ТОКЕН_ОТ_BOTFATHER"
bot = telegram.Bot(token=BOT_TOKEN)

@app.route("/api/send", methods=["POST"])
def send_message():
    data = request.json
    chat_id = data.get("chat_id")  # TG user ID
    text = data.get("text")
    
    async def _send():
        await bot.send_message(chat_id=chat_id, text=text)
    
    asyncio.run(_send())
    return jsonify({"ok": True})

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)`}
                  </pre>
                </div>

                <div className="mt-3">
                  <div className="font-semibold mb-1" style={{ color: "var(--text-main)" }}>requirements.txt:</div>
                  <pre className="p-2 rounded-xl text-xs" style={{ background: "var(--bg-main)", color: "var(--text-main)" }}>
{`flask
flask-cors
python-telegram-bot`}
                  </pre>
                </div>

                <div className="mt-3">
                  <div className="font-semibold mb-1" style={{ color: "var(--text-main)" }}>Бесплатный деплой бэкенда на Render.com:</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Зайди на <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">render.com</a> → регистрация бесплатно</li>
                    <li>New → Web Service → подключи GitHub репозиторий</li>
                    <li>Build Command: <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>pip install -r requirements.txt</code></li>
                    <li>Start Command: <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>python bot_server.py</code></li>
                    <li>Получишь URL: <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>https://your-bot.onrender.com</code></li>
                    <li>В Vercel добавь Environment Variable: <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>VITE_BACKEND_URL=https://your-bot.onrender.com</code></li>
                  </ol>
                </div>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #f59e0b" }}>
                <div className="font-bold mb-2" style={{ color: "var(--text-main)" }}>⚡ Вариант 2: User API (от имени аккаунта)</div>
                <p className="mb-2">Позволяет писать от имени <strong>реального TG аккаунта</strong>, а не бота. Нужен VPS (от 100₽/мес) или бесплатный Oracle Cloud.</p>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "var(--bg-main)", color: "var(--text-main)" }}>
{`# user_api_server.py
# pip install telethon flask flask-cors

from flask import Flask, request, jsonify
from flask_cors import CORS
from telethon import TelegramClient
import asyncio

app = Flask(__name__)
CORS(app)

# Получи на https://my.telegram.org → API development tools
API_ID = 12345678
API_HASH = "ваш_api_hash"
PHONE = "+79001234567"  # Ваш номер TG аккаунта

client = TelegramClient("session", API_ID, API_HASH)

async def init_client():
    await client.start(phone=PHONE)
    # При первом запуске попросит ввести код из TG

@app.route("/api/send", methods=["POST"])
def send_message():
    data = request.json
    username = data.get("username")  # @username лида
    text = data.get("text")
    
    async def _send():
        await client.send_message(username, text)
    
    loop = asyncio.get_event_loop()
    loop.run_until_complete(_send())
    return jsonify({"ok": True})

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(init_client())
    app.run(host="0.0.0.0", port=8000)`}
                </pre>
                <div className="mt-2">
                  <div className="font-semibold mb-1" style={{ color: "var(--text-main)" }}>Как получить API_ID и API_HASH:</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Зайди на <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">my.telegram.org</a></li>
                    <li>Войди по номеру телефона</li>
                    <li>Нажми <strong>"API development tools"</strong></li>
                    <li>Заполни форму (app title, short name — любые)</li>
                    <li>Скопируй <strong>API_ID</strong> и <strong>API_HASH</strong></li>
                  </ol>
                </div>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #8b5cf6" }}>
                <div className="font-bold mb-2" style={{ color: "var(--text-main)" }}>📱 Вариант 3: Ручной режим (без бэкенда)</div>
                <p>Используй CRM просто как <strong>систему учёта</strong>:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Добавляй лидов вручную</li>
                  <li>Нажимай кнопку <strong>"TG ↗"</strong> в чате — откроется Telegram с нужным контактом</li>
                  <li>Копируй быстрые ответы из CRM и вставляй в TG</li>
                  <li>Меняй статусы лидов в CRM</li>
                  <li>Отслеживай доставки, задачи, баланс</li>
                </ul>
                <p className="mt-2 font-semibold" style={{ color: "#22c55e" }}>✅ Этот вариант работает прямо сейчас, без настройки!</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {section === "code" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-lg mb-3" style={{ color: "var(--text-main)" }}>💻 Добавить TG аккаунт через код</h3>
            <div className="space-y-4 text-sm" style={{ color: "var(--text-sub)" }}>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #4f46e5" }}>
                <div className="font-bold mb-2" style={{ color: "var(--text-main)" }}>Через интерфейс (самый простой способ)</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Войди в CRM как <strong>admin</strong></li>
                  <li>Зайди в <strong>⚙️ Настройки → 📱 Аккаунты</strong></li>
                  <li>Нажми <strong>"+ Аккаунт"</strong></li>
                  <li>Введи название и телефон</li>
                  <li>Готово! Теперь можно назначать лидов на этот аккаунт</li>
                </ol>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #22c55e" }}>
                <div className="font-bold mb-2" style={{ color: "var(--text-main)" }}>Через код (src/data.ts)</div>
                <p className="mb-2">Открой файл <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>src/data.ts</code> и найди массив <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-main)" }}>initTgAccounts</code>:</p>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "var(--bg-main)", color: "var(--text-main)" }}>
{`// src/data.ts — найди этот массив и добавь новый аккаунт:

export const initTgAccounts: TgAccount[] = [
  {
    id: 1,
    label: "Основной акк",
    phone: "+79001234567",
    is_active: true,
    hold_balance: 0,
    total_earned: 0,
    leads_count: 0,
  },
  {
    id: 2,
    label: "TikTok акк",
    phone: "+79007654321",
    is_active: true,
    hold_balance: 0,
    total_earned: 0,
    leads_count: 0,
  },
  // ← ДОБАВЬ СЮДА НОВЫЙ АККАУНТ:
  {
    id: 3,                        // уникальный ID
    label: "Instagram акк",       // название
    phone: "+79009876543",        // телефон TG
    is_active: true,              // активен
    hold_balance: 0,              // баланс в холде
    total_earned: 0,              // заработано
    leads_count: 0,               // кол-во лидов
  },
];`}
                </pre>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #f59e0b" }}>
                <div className="font-bold mb-2" style={{ color: "var(--text-main)" }}>Для User API: добавить несколько аккаунтов</div>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "var(--bg-main)", color: "var(--text-main)" }}>
{`# На бэкенде (Python) — несколько аккаунтов:
# multi_account_server.py

from telethon import TelegramClient

ACCOUNTS = {
    1: {
        "api_id": 12345,
        "api_hash": "abc123...",
        "phone": "+79001234567",
        "session": "session_main",
    },
    2: {
        "api_id": 12345,
        "api_hash": "abc123...",
        "phone": "+79007654321",
        "session": "session_tiktok",
    },
    3: {
        "api_id": 12345,
        "api_hash": "abc123...",
        "phone": "+79009876543",
        "session": "session_instagram",
    },
}

clients = {}

async def init_all():
    for acc_id, acc in ACCOUNTS.items():
        client = TelegramClient(
            acc["session"],
            acc["api_id"],
            acc["api_hash"]
        )
        await client.start(phone=acc["phone"])
        clients[acc_id] = client
        print(f"✅ Аккаунт {acc_id} подключён")

# В endpoint /api/send используй:
# account_id = data.get("tg_account_id")
# client = clients[account_id]
# await client.send_message(username, text)`}
                </pre>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #3b82f6" }}>
                <div className="font-bold mb-2" style={{ color: "var(--text-main)" }}>🔄 После изменения кода:</div>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "var(--bg-main)", color: "var(--text-main)" }}>
{`# 1. Сохрани файл

# 2. Закоммить и запушь:
git add .
git commit -m "Добавил новый TG аккаунт"
git push

# 3. Vercel автоматически пересоберёт проект!
# (обычно за 30-60 секунд)

# Или для локального запуска:
npm run dev`}
                </pre>
              </div>

              <div className="crm-card p-4" style={{ borderLeft: "4px solid #ef4444" }}>
                <div className="font-bold mb-2" style={{ color: "#ef4444" }}>⚠️ Структура проекта для деплоя</div>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "var(--bg-main)", color: "var(--text-main)" }}>
{`tg-card-crm/
├── index.html          # точка входа
├── package.json        # зависимости
├── vite.config.ts      # конфиг сборки
├── vercel.json         # конфиг Vercel
├── tsconfig.json       # конфиг TypeScript
└── src/
    ├── main.tsx        # точка входа React
    ├── App.tsx         # главный компонент
    ├── data.ts         # данные и типы ← ЗДЕСЬ аккаунты
    ├── components.tsx  # UI компоненты
    ├── pages.tsx       # страницы
    ├── config.ts       # URL бэкенда
    └── index.css       # стили`}
                </pre>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-3" style={{ color: "var(--text-main)" }}>📋 Полная схема: CRM + TG (бесплатно)</h3>
            <div className="text-sm space-y-2" style={{ color: "var(--text-sub)" }}>
              <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-main)" }}>
                <pre className="text-xs whitespace-pre-wrap" style={{ color: "var(--text-main)" }}>
{`┌─────────────────┐    ┌──────────────────┐    ┌──────────────┐
│  TG Card CRM    │───▶│  Backend (Flask)  │───▶│  Telegram    │
│  (Vercel/бесп.) │    │  (Render/бесп.)   │    │  User API    │
│                 │◀───│                   │◀───│              │
│  React+Vite     │    │  Python+Telethon  │    │  Ваш аккаунт │
└─────────────────┘    └──────────────────┘    └──────────────┘
   Фронтенд               Сервер                 Telegram

Всё бесплатно:
• Vercel — бесплатный хостинг фронтенда
• Render.com — бесплатный хостинг бэкенда
• Telegram API — бесплатно
• GitHub — бесплатный репозиторий`}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function OffersTab({ offers, setOffers, cabinets, setCabinets }: {
  offers: Offer[]; setOffers: (o: Offer[]) => void;
  cabinets: LkCabinet[]; setCabinets: (c: LkCabinet[]) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const sorted = [...offers].sort((a, b) => a.sort_order - b.sort_order);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const newOffers = [...sorted];
    const [moved] = newOffers.splice(dragIdx, 1);
    newOffers.splice(targetIdx, 0, moved);
    setOffers(newOffers.map((o, i) => ({ ...o, sort_order: i })));
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const saveOffer = (offer: Offer) => {
    const exists = offers.find(o => o.id === offer.id);
    if (exists) setOffers(offers.map(o => o.id === offer.id ? offer : o));
    else setOffers([...offers, { ...offer, id: Math.max(0, ...offers.map(o => o.id)) + 1, sort_order: offers.length }]);
    setEditOffer(null);
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold" style={{ color: "var(--text-main)" }}>Офферы (перетаскивайте для сортировки)</h3>
        <Btn onClick={() => setShowAdd(true)}>+ Оффер</Btn>
      </div>
      {sorted.map((o, idx) => {
        const offerCabinets = cabinets.filter(c => c.offer_id === o.id);
        return (
          <Card
            key={o.id}
            className={`transition-all ${dragOverIdx === idx ? "!border-indigo-500" : ""}`}
          >
            <div
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg cursor-grab">⠿</span>
                <div>
                  <div className="font-medium" style={{ color: "var(--text-main)" }}>{o.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {o.type === "lk" ? "ЛК" : "Партнёрка"} • {o.reward_amount.toLocaleString()} ₽
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Toggle checked={o.is_active} onChange={v => setOffers(offers.map(of => of.id === o.id ? { ...of, is_active: v } : of))} />
                <button onClick={() => setEditOffer(o)} className="text-sm cursor-pointer" style={{ color: "var(--text-sub)" }}>✏️</button>
              </div>
            </div>
            {/* ЛК кабинеты */}
            {o.type === "lk" && offerCabinets.length > 0 && (
              <div className="mt-3 pl-8 space-y-2">
                {offerCabinets.map(c => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>{c.name}</span>
                    <div className="flex-1 max-w-[200px]">
                      <LimitBar current={c.leads_count} max={c.max_leads} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <Modal open={editOffer !== null || showAdd} onClose={() => { setEditOffer(null); setShowAdd(false); }} title={editOffer ? "Редактировать оффер" : "Новый оффер"}>
        <OfferForm offer={editOffer} onSave={saveOffer} onClose={() => { setEditOffer(null); setShowAdd(false); }} />
      </Modal>
    </div>
  );
}

function OfferForm({ offer, onSave, onClose }: { offer: Offer | null; onSave: (o: Offer) => void; onClose: () => void }) {
  const empty: Offer = { id: 0, name: "", type: "partner", partner_network_id: null, reward_amount: 0, is_active: true, notes: "", sort_order: 0 };
  const [form, setForm] = useState(offer || empty);
  useEffect(() => { setForm(offer || empty); }, [offer]);
  return (
    <div className="space-y-3">
      <Input label="Название" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <Select label="Тип" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as "lk" | "partner" })}>
        <option value="lk">ЛК</option>
        <option value="partner">Партнёрка</option>
      </Select>
      <Input label="Вознаграждение (₽)" type="number" value={form.reward_amount} onChange={e => setForm({ ...form, reward_amount: Number(e.target.value) })} />
      <Textarea label="Заметки" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      <div className="flex justify-end gap-2">
        <Btn variant="secondary" onClick={onClose}>Отмена</Btn>
        <Btn onClick={() => onSave(form)}>Сохранить</Btn>
      </div>
    </div>
  );
}

function AccountsTab({ accounts, setAccounts }: { accounts: TgAccount[]; setAccounts: (a: TgAccount[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const addAccount = () => {
    if (!newLabel.trim()) return;
    const newAcc: TgAccount = {
      id: Math.max(0, ...accounts.map(a => a.id)) + 1,
      label: newLabel,
      phone: newPhone,
      is_active: true,
      hold_balance: 0,
      total_earned: 0,
      leads_count: 0,
    };
    setAccounts([...accounts, newAcc]);
    setNewLabel("");
    setNewPhone("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold" style={{ color: "var(--text-main)" }}>TG Аккаунты</h3>
        <Btn onClick={() => setShowAdd(true)}>+ Аккаунт</Btn>
      </div>
      {accounts.map(a => (
        <Card key={a.id}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium" style={{ color: "var(--text-main)" }}>{a.label}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {a.phone} • {a.leads_count} лидов • {a.total_earned.toLocaleString()} ₽
              </div>
            </div>
            <Toggle checked={a.is_active} onChange={v => setAccounts(accounts.map(acc => acc.id === a.id ? { ...acc, is_active: v } : acc))} />
          </div>
        </Card>
      ))}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новый аккаунт">
        <div className="space-y-3">
          <Input label="Название" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Например: Основной акк" />
          <Input label="Телефон" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+79001234567" />
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setShowAdd(false)}>Отмена</Btn>
            <Btn onClick={addAccount}>Добавить</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PartnersTab({ networks, setNetworks }: { networks: PartnerNetwork[]; setNetworks: (p: PartnerNetwork[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const addNetwork = () => {
    if (!newName.trim()) return;
    const n: PartnerNetwork = {
      id: Math.max(0, ...networks.map(p => p.id)) + 1,
      name: newName, url: newUrl, notes: newNotes,
    };
    setNetworks([...networks, n]);
    setNewName(""); setNewUrl(""); setNewNotes("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold" style={{ color: "var(--text-main)" }}>Партнёрские сети</h3>
        <Btn onClick={() => setShowAdd(true)}>+ Партнёрка</Btn>
      </div>
      {networks.map(n => (
        <Card key={n.id}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium" style={{ color: "var(--text-main)" }}>{n.name}</div>
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">{n.url}</a>
              {n.notes && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{n.notes}</div>}
            </div>
            <button onClick={() => setNetworks(networks.filter(p => p.id !== n.id))} className="text-sm cursor-pointer" style={{ color: "#ef4444" }}>🗑</button>
          </div>
        </Card>
      ))}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новая партнёрка">
        <div className="space-y-3">
          <Input label="Название" value={newName} onChange={e => setNewName(e.target.value)} />
          <Input label="URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
          <Textarea label="Заметки" value={newNotes} onChange={e => setNewNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setShowAdd(false)}>Отмена</Btn>
            <Btn onClick={addNetwork}>Добавить</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══ USERS ADMIN PANEL ═══
function UsersAdminPanel({ accounts, users, setUsers }: {
  accounts: TgAccount[]; users: CRMUser[]; setUsers: (u: CRMUser[]) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLogin, setNewLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newAccIds, setNewAccIds] = useState<number[]>([]);
  const [editUser, setEditUser] = useState<CRMUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editAccIds, setEditAccIds] = useState<number[]>([]);
  const [changePasswordId, setChangePasswordId] = useState<number | null>(null);
  const [newPwd, setNewPwd] = useState("");

  const addUser = async () => {
    if (!newLogin.trim() || !newPassword.trim() || !newName.trim()) return;
    const hash = await hashPassword(newPassword);
    const user: CRMUser = {
      id: Math.max(0, ...users.map(u => u.id)) + 1,
      login: newLogin, passwordHash: hash,
      role: "manager", name: newName,
      allowedAccountIds: newAccIds,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, user];
    setUsers(updated);
    localStorage.setItem("crm-users", JSON.stringify(updated));
    setNewLogin(""); setNewPassword(""); setNewName(""); setNewAccIds([]);
    setShowAdd(false);
  };

  const startEdit = (u: CRMUser) => {
    setEditUser(u);
    setEditName(u.name);
    setEditAccIds([...u.allowedAccountIds]);
  };

  const saveEdit = () => {
    if (!editUser) return;
    const updated = users.map(u => u.id === editUser.id ? { ...u, name: editName, allowedAccountIds: editAccIds } : u);
    setUsers(updated);
    localStorage.setItem("crm-users", JSON.stringify(updated));
    setEditUser(null);
  };

  const toggleBlock = (id: number) => {
    const updated = users.map(u => u.id === id ? { ...u, isBlocked: !u.isBlocked } : u);
    setUsers(updated);
    localStorage.setItem("crm-users", JSON.stringify(updated));
  };

  const deleteUser = (id: number) => {
    if (!confirm("Удалить пользователя?")) return;
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem("crm-users", JSON.stringify(updated));
  };

  const doChangePassword = async () => {
    if (!newPwd.trim() || changePasswordId === null) return;
    const hash = await hashPassword(newPwd);
    const updated = users.map(u => u.id === changePasswordId ? { ...u, passwordHash: hash } : u);
    setUsers(updated);
    localStorage.setItem("crm-users", JSON.stringify(updated));
    setChangePasswordId(null);
    setNewPwd("");
  };

  const managers = users.filter(u => u.role === "manager");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold" style={{ color: "var(--text-main)" }}>Менеджеры</h3>
        <Btn onClick={() => setShowAdd(true)}>+ Менеджер</Btn>
      </div>

      {managers.length === 0 ? (
        <Empty icon="👥" text="Нет менеджеров" />
      ) : (
        managers.map(u => (
          <Card key={u.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: "var(--text-main)" }}>{u.name}</span>
                  {u.isBlocked && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#fee2e2", color: "#b91c1c" }}>Заблокирован</span>}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Логин: {u.login} • Аккаунты: {u.allowedAccountIds.length === 0 ? "все" : u.allowedAccountIds.map(id => accounts.find(a => a.id === id)?.label).join(", ")}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(u)} className="px-2 py-1 rounded-lg text-xs cursor-pointer" style={{ background: "var(--bg-main)", color: "var(--text-sub)" }}>✏️</button>
                <button onClick={() => setChangePasswordId(u.id)} className="px-2 py-1 rounded-lg text-xs cursor-pointer" style={{ background: "var(--bg-main)", color: "var(--text-sub)" }}>🔑</button>
                <button onClick={() => toggleBlock(u.id)} className="px-2 py-1 rounded-lg text-xs cursor-pointer" style={{ background: u.isBlocked ? "#dcfce7" : "#ffedd5", color: u.isBlocked ? "#15803d" : "#c2410c" }}>
                  {u.isBlocked ? "✓" : "🚫"}
                </button>
                <button onClick={() => deleteUser(u.id)} className="px-2 py-1 rounded-lg text-xs cursor-pointer" style={{ background: "#fee2e2", color: "#b91c1c" }}>🗑</button>
              </div>
            </div>
          </Card>
        ))
      )}

      {/* Add manager modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новый менеджер">
        <div className="space-y-3">
          <Input label="Логин" value={newLogin} onChange={e => setNewLogin(e.target.value)} />
          <Input label="Пароль" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <Input label="Имя" value={newName} onChange={e => setNewName(e.target.value)} />
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-sub)" }}>Доступ к аккаунтам (пусто = все)</label>
            <AccountCheckboxList accounts={accounts} selected={newAccIds} onChange={setNewAccIds} />
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setShowAdd(false)}>Отмена</Btn>
            <Btn onClick={addUser}>Добавить</Btn>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={editUser !== null} onClose={() => setEditUser(null)} title="Редактировать">
        <div className="space-y-3">
          <Input label="Имя" value={editName} onChange={e => setEditName(e.target.value)} />
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-sub)" }}>Аккаунты</label>
            <AccountCheckboxList accounts={accounts} selected={editAccIds} onChange={setEditAccIds} />
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setEditUser(null)}>Отмена</Btn>
            <Btn onClick={saveEdit}>Сохранить</Btn>
          </div>
        </div>
      </Modal>

      {/* Change password modal */}
      <Modal open={changePasswordId !== null} onClose={() => setChangePasswordId(null)} title="Сменить пароль">
        <div className="space-y-3">
          <Input label="Новый пароль" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setChangePasswordId(null)}>Отмена</Btn>
            <Btn onClick={doChangePassword}>Сохранить</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
