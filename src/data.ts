export type LeadStatus =
  | "новый"
  | "самовывоз"
  | "доставка"
  | "сделано"
  | "оплачено"
  | "сделать_цд"
  | "холд"
  | "отказ";

export const ALL_STATUSES: LeadStatus[] = [
  "новый", "самовывоз", "доставка", "сделано",
  "оплачено", "сделать_цд", "холд", "отказ",
];

export const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; color: string; dot: string }> = {
  "новый":       { label: "Новый",       bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  "самовывоз":   { label: "Самовывоз",   bg: "#ede9fe", color: "#7c3aed", dot: "#8b5cf6" },
  "доставка":    { label: "Доставка",    bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  "сделано":     { label: "Сделано",     bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "оплачено":    { label: "Оплачено",    bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  "сделать_цд":  { label: "Сделать ЦД",  bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  "холд":        { label: "Холд",        bg: "#ffedd5", color: "#c2410c", dot: "#f97316" },
  "отказ":       { label: "Отказ",       bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
};

export const STATUS_CONFIG_DARK: Record<LeadStatus, { bg: string; color: string; dot: string }> = {
  "новый":       { bg: "#1e293b", color: "#94a3b8", dot: "#94a3b8" },
  "самовывоз":   { bg: "#2e1065", color: "#c4b5fd", dot: "#8b5cf6" },
  "доставка":    { bg: "#1e3a8a", color: "#93c5fd", dot: "#3b82f6" },
  "сделано":     { bg: "#14532d", color: "#86efac", dot: "#22c55e" },
  "оплачено":    { bg: "#064e3b", color: "#6ee7b7", dot: "#10b981" },
  "сделать_цд":  { bg: "#451a03", color: "#fcd34d", dot: "#f59e0b" },
  "холд":        { bg: "#431407", color: "#fb923c", dot: "#f97316" },
  "отказ":       { bg: "#450a0a", color: "#fca5a5", dot: "#ef4444" },
};

export interface TgAccount {
  id: number; label: string; phone: string;
  is_active: boolean; hold_balance: number;
  total_earned: number; leads_count: number;
}

export interface PartnerNetwork {
  id: number; name: string; url: string; notes: string;
}

export interface Offer {
  id: number; name: string; type: "lk" | "partner";
  partner_network_id: number | null;
  reward_amount: number; is_active: boolean;
  notes: string; sort_order: number;
}

export interface LkCabinet {
  id: number; name: string; offer_id: number;
  referral_link: string; leads_count: number;
  max_leads: number; is_active: boolean; notes: string;
}

export interface Lead {
  id: number; tg_user_id: string; tg_username: string;
  full_name: string; phone: string; source: string;
  tg_account_id: number; offer_id: number; cabinet_id: number | null;
  status: LeadStatus; delivery_date: string; delivery_address: string;
  is_paid: boolean; paid_date: string; reward_paid: number;
  in_tg_folder: boolean; chat_deleted: boolean; deleted_by: string;
  notes: string; created_at: string; updated_at: string;
}

export interface ChatMessage {
  id: number; lead_id: number; tg_account_id: number;
  direction: "incoming" | "outgoing"; text: string; sent_at: string;
}

export interface Task {
  id: number; title: string; lead_ids: number[];
  recipients_count: number; due_at: string;
  is_done: boolean; tg_account_id: number;
  notes: string; created_at: string;
}

export interface QuickReply {
  id: number; shortcut: string; text: string; is_active: boolean;
}

export interface BalanceRecord {
  id: number; tg_account_id: number; amount: number;
  type: "hold" | "earned" | "withdrawal";
  offer_id: number | null; lead_id: number | null;
  description: string; created_at: string;
}

export interface CRMUser {
  id: number; login: string; passwordHash: string;
  role: "admin" | "manager"; name: string;
  allowedAccountIds: number[]; isBlocked: boolean;
  createdAt: string;
}

// ═══ НАЧАЛЬНЫЕ ДАННЫЕ ═══

export const initTgAccounts: TgAccount[] = [
  { id: 1, label: "Основной акк", phone: "+79001234567", is_active: true, hold_balance: 5200, total_earned: 18400, leads_count: 42 },
  { id: 2, label: "TikTok акк",   phone: "+79007654321", is_active: true, hold_balance: 7300, total_earned: 26800, leads_count: 61 },
];

export const initPartnerNetworks: PartnerNetwork[] = [
  { id: 1, name: "rafinad",   url: "https://rafinad.io",   notes: "Тбанк" },
  { id: 2, name: "lead.su",   url: "https://lead.su",      notes: "Газпром" },
  { id: 3, name: "myleadgid", url: "https://myleadgid.ru", notes: "ВТБ" },
];

export const initOffers: Offer[] = [
  { id: 1, name: "Альфа Black", type: "lk",      partner_network_id: null, reward_amount: 1800, is_active: true, notes: "", sort_order: 0 },
  { id: 2, name: "Тбанк",       type: "partner",  partner_network_id: 1,    reward_amount: 1500, is_active: true, notes: "", sort_order: 1 },
  { id: 3, name: "Газпром",     type: "partner",  partner_network_id: 2,    reward_amount: 1200, is_active: true, notes: "", sort_order: 2 },
  { id: 4, name: "ВТБ",         type: "partner",  partner_network_id: 3,    reward_amount: 1300, is_active: true, notes: "", sort_order: 3 },
  { id: 5, name: "Озон",        type: "lk",       partner_network_id: null, reward_amount: 1600, is_active: true, notes: "", sort_order: 4 },
];

export const initCabinets: LkCabinet[] = [
  { id: 1, name: "ЛК Альфа #1", offer_id: 1, referral_link: "https://alfa.ru/ref1", leads_count: 28, max_leads: 33, is_active: true, notes: "" },
  { id: 2, name: "ЛК Альфа #2", offer_id: 1, referral_link: "https://alfa.ru/ref2", leads_count: 18, max_leads: 33, is_active: true, notes: "" },
  { id: 3, name: "ЛК Озон #1",  offer_id: 5, referral_link: "https://ozon.ru/ref1", leads_count: 12, max_leads: 33, is_active: true, notes: "" },
];

const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split("T")[0];
const in3days = new Date(); in3days.setDate(in3days.getDate() + 3);
const in3daysStr = in3days.toISOString().split("T")[0];

export const initLeads: Lead[] = [
  {
    id: 1, tg_user_id: "111111", tg_username: "ivan_petrov", full_name: "Иван Петров",
    phone: "+79001111111", source: "tiktok", tg_account_id: 1, offer_id: 1, cabinet_id: 1,
    status: "доставка", delivery_date: tomorrowStr, delivery_address: "Москва, ул. Ленина 5",
    is_paid: false, paid_date: "", reward_paid: 0, in_tg_folder: true, chat_deleted: false,
    deleted_by: "", notes: "Ждёт доставку", created_at: "2024-01-10T10:00:00Z", updated_at: "2024-01-15T12:00:00Z",
  },
  {
    id: 2, tg_user_id: "222222", tg_username: "anna_sidorova", full_name: "Анна Сидорова",
    phone: "+79002222222", source: "tiktok", tg_account_id: 1, offer_id: 2, cabinet_id: null,
    status: "оплачено", delivery_date: "", delivery_address: "",
    is_paid: true, paid_date: "2024-01-14", reward_paid: 1500, in_tg_folder: true, chat_deleted: false,
    deleted_by: "", notes: "", created_at: "2024-01-12T11:00:00Z", updated_at: "2024-01-14T15:00:00Z",
  },
  {
    id: 3, tg_user_id: "333333", tg_username: "petr_volkov", full_name: "Пётр Волков",
    phone: "+79003333333", source: "instagram", tg_account_id: 2, offer_id: 3, cabinet_id: null,
    status: "самовывоз", delivery_date: in3daysStr, delivery_address: "Офис на Арбате",
    is_paid: false, paid_date: "", reward_paid: 0, in_tg_folder: false, chat_deleted: false,
    deleted_by: "", notes: "Заберёт сам", created_at: "2024-01-13T09:00:00Z", updated_at: "2024-01-13T09:00:00Z",
  },
  {
    id: 4, tg_user_id: "444444", tg_username: "maria_k", full_name: "Мария Козлова",
    phone: "+79004444444", source: "tiktok", tg_account_id: 2, offer_id: 1, cabinet_id: 2,
    status: "сделать_цд", delivery_date: "", delivery_address: "",
    is_paid: false, paid_date: "", reward_paid: 0, in_tg_folder: false, chat_deleted: true,
    deleted_by: "клиент", notes: "Нужно сделать ЦД", created_at: "2024-01-14T14:00:00Z", updated_at: "2024-01-14T14:00:00Z",
  },
  {
    id: 5, tg_user_id: "555555", tg_username: "alex_new", full_name: "Алексей Новиков",
    phone: "+79005555555", source: "vk", tg_account_id: 1, offer_id: 4, cabinet_id: null,
    status: "холд", delivery_date: "", delivery_address: "",
    is_paid: false, paid_date: "", reward_paid: 0, in_tg_folder: false, chat_deleted: false,
    deleted_by: "", notes: "Проверка документов", created_at: "2024-01-15T08:00:00Z", updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: 6, tg_user_id: "666666", tg_username: "svetlana_m", full_name: "Светлана Морозова",
    phone: "+79006666666", source: "tiktok", tg_account_id: 2, offer_id: 5, cabinet_id: 3,
    status: "новый", delivery_date: "", delivery_address: "",
    is_paid: false, paid_date: "", reward_paid: 0, in_tg_folder: false, chat_deleted: false,
    deleted_by: "", notes: "", created_at: "2024-01-16T10:00:00Z", updated_at: "2024-01-16T10:00:00Z",
  },
];

export const initTasks: Task[] = [
  {
    id: 1, title: "Отписать про самовывоз", lead_ids: [3], recipients_count: 1,
    due_at: new Date(Date.now() + 2 * 3600000).toISOString(), is_done: false,
    tg_account_id: 2, notes: "Напомнить адрес офиса", created_at: "2024-01-16T08:00:00Z",
  },
  {
    id: 2, title: "Напомнить про доставку завтра", lead_ids: [1], recipients_count: 1,
    due_at: new Date(Date.now() + 30 * 60000).toISOString(), is_done: false,
    tg_account_id: 1, notes: "Отправить таймер в TG", created_at: "2024-01-16T09:00:00Z",
  },
];

export const initQuickReplies: QuickReply[] = [
  { id: 1, shortcut: "привет",   text: "Привет! 👋 Расскажу подробнее о карте — что вас интересует?", is_active: true },
  { id: 2, shortcut: "доставка", text: "Доставка бесплатная, курьером на дом, 1–3 рабочих дня 🚚", is_active: true },
  { id: 3, shortcut: "условия",  text: "Карта бесплатная: 0₽ обслуживание, кэшбэк до 33%, нужен только паспорт 💳", is_active: true },
  { id: 4, shortcut: "завтра",   text: "Завтра к вам приедет курьер с картой! Пожалуйста, будьте дома с 10 до 18 📦", is_active: true },
  { id: 5, shortcut: "готово",   text: "Отлично, карта оформлена! Ожидайте звонка от курьера ✅", is_active: true },
  { id: 6, shortcut: "цд",       text: "Нужно сделать цифровую доставку — пришлите скан паспорта 📋", is_active: true },
  { id: 7, shortcut: "отказ",    text: "Хорошо, понял! Если передумаете — обращайтесь, всегда рад помочь 😊", is_active: true },
  { id: 8, shortcut: "статус",   text: "Карта уже в пути! Трекинг доставки отправлю чуть позже 📍", is_active: true },
];

export const initChatMessages: ChatMessage[] = [
  { id: 1,  lead_id: 1, tg_account_id: 1, direction: "incoming", text: "Привет! Когда придёт карта?", sent_at: "2024-01-15T10:00:00Z" },
  { id: 2,  lead_id: 1, tg_account_id: 1, direction: "outgoing", text: "Доставка завтра, с 10 до 18 🚚", sent_at: "2024-01-15T10:05:00Z" },
  { id: 3,  lead_id: 1, tg_account_id: 1, direction: "incoming", text: "Отлично, буду ждать!", sent_at: "2024-01-15T10:07:00Z" },
  { id: 4,  lead_id: 2, tg_account_id: 1, direction: "incoming", text: "Карта пришла, спасибо!", sent_at: "2024-01-14T14:00:00Z" },
  { id: 5,  lead_id: 2, tg_account_id: 1, direction: "outgoing", text: "Отлично! Пользуйтесь на здоровье 💳", sent_at: "2024-01-14T14:05:00Z" },
  { id: 6,  lead_id: 3, tg_account_id: 2, direction: "incoming", text: "Когда можно забрать?", sent_at: "2024-01-13T09:00:00Z" },
  { id: 7,  lead_id: 3, tg_account_id: 2, direction: "outgoing", text: "Офис открыт пн-пт с 9 до 18, ул. Арбат", sent_at: "2024-01-13T09:10:00Z" },
  { id: 8,  lead_id: 3, tg_account_id: 2, direction: "incoming", text: "Ок, приеду в среду 👍", sent_at: "2024-01-13T09:15:00Z" },
  { id: 9,  lead_id: 4, tg_account_id: 2, direction: "incoming", text: "Здравствуйте, а что за карта?", sent_at: "2024-01-14T14:00:00Z" },
  { id: 10, lead_id: 4, tg_account_id: 2, direction: "outgoing", text: "Альфа Black — бесплатная карта с кэшбэком до 33%! 💳", sent_at: "2024-01-14T14:02:00Z" },
  { id: 11, lead_id: 4, tg_account_id: 2, direction: "incoming", text: "Интересно, что нужно для оформления?", sent_at: "2024-01-14T14:05:00Z" },
  { id: 12, lead_id: 5, tg_account_id: 1, direction: "incoming", text: "Добрый день, видел рекламу карты", sent_at: "2024-01-15T08:00:00Z" },
  { id: 13, lead_id: 5, tg_account_id: 1, direction: "outgoing", text: "Здравствуйте! Какая карта вас заинтересовала?", sent_at: "2024-01-15T08:03:00Z" },
  { id: 14, lead_id: 5, tg_account_id: 1, direction: "incoming", text: "ВТБ, какие условия?", sent_at: "2024-01-15T08:05:00Z" },
  { id: 15, lead_id: 5, tg_account_id: 1, direction: "outgoing", text: "Кэшбэк 10%, бесплатное обслуживание. Нужен только паспорт 📋", sent_at: "2024-01-15T08:07:00Z" },
  { id: 16, lead_id: 6, tg_account_id: 2, direction: "incoming", text: "Привет! Подруга рассказала про карту Озон 🛒", sent_at: "2024-01-16T10:00:00Z" },
  { id: 17, lead_id: 6, tg_account_id: 2, direction: "outgoing", text: "Привет! Да, карта Озон — кэшбэк баллами. Расскажу подробнее?", sent_at: "2024-01-16T10:02:00Z" },
];

export const initBalanceHistory: BalanceRecord[] = [
  { id: 1, tg_account_id: 1, amount: 1800,  type: "hold",       offer_id: 1,    lead_id: 1,    description: "Лид Иван Петров — Альфа Black", created_at: "2024-01-15T10:00:00Z" },
  { id: 2, tg_account_id: 1, amount: 1500,  type: "earned",     offer_id: 2,    lead_id: 2,    description: "Лид Анна Сидорова — Тбанк",    created_at: "2024-01-14T15:00:00Z" },
  { id: 3, tg_account_id: 2, amount: -5000, type: "withdrawal", offer_id: null, lead_id: null, description: "Вывод средств",                 created_at: "2024-01-13T12:00:00Z" },
  { id: 4, tg_account_id: 2, amount: 1200,  type: "hold",       offer_id: 3,    lead_id: 3,    description: "Лид Пётр Волков — Газпром",    created_at: "2024-01-13T09:00:00Z" },
  { id: 5, tg_account_id: 2, amount: 1300,  type: "earned",     offer_id: 4,    lead_id: 5,    description: "Лид Алексей Новиков — ВТБ",    created_at: "2024-01-12T11:00:00Z" },
];

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// SHA-256 hash of "admin123"
export const ADMIN_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";
