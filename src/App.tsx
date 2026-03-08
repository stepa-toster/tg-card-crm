import { useState, useEffect } from "react";
import {
  type CRMUser, type Lead, type Offer, type TgAccount, type LkCabinet,
  type ChatMessage, type Task, type QuickReply, type BalanceRecord,
  type PartnerNetwork,
  initLeads, initOffers, initTgAccounts, initCabinets,
  initChatMessages, initTasks, initQuickReplies, initBalanceHistory,
  initPartnerNetworks, hashPassword, ADMIN_HASH,
} from "./data";
import { Toast } from "./components";
import { LeadsPage, ChatPage, BalancePage, TasksPage, SettingsPage } from "./pages";

// ═══ THEME HOOK ═══
function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("crm-theme");
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    return isDark;
  });

  const toggle = () => setDark(d => {
    const newDark = !d;
    if (newDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("crm-theme", newDark ? "dark" : "light");
    return newDark;
  });

  return { dark, toggle };
}

// ═══ LOGIN SCREEN ═══
function LoginScreen({ onLogin }: { onLogin: (user: CRMUser) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const hash = await hashPassword(password);

    // Load users from localStorage
    let users: CRMUser[] = [];
    try {
      const saved = localStorage.getItem("crm-users");
      if (saved) users = JSON.parse(saved);
    } catch { /* empty */ }

    // Create default admin if no users
    if (users.length === 0) {
      const admin: CRMUser = {
        id: 1, login: "admin", passwordHash: ADMIN_HASH,
        role: "admin", name: "Администратор",
        allowedAccountIds: [], isBlocked: false,
        createdAt: new Date().toISOString(),
      };
      users = [admin];
      localStorage.setItem("crm-users", JSON.stringify(users));
    }

    const user = users.find(u => u.login === login && u.passwordHash === hash);
    if (!user) {
      setError("Неверный логин или пароль");
      setLoading(false);
      return;
    }
    if (user.isBlocked) {
      setError("Аккаунт заблокирован");
      setLoading(false);
      return;
    }
    setLoading(false);
    onLogin(user);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4f46e5 60%, #6366f1 100%)",
      }}
    >
      <div className="w-full max-w-sm animate-slideUp">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💳</div>
          <h1 className="text-2xl font-bold text-white">TG Card CRM</h1>
          <p className="text-indigo-200 text-sm mt-1">Система управления лидами</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl shadow-2xl"
          style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-indigo-200 mb-1">Логин</label>
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                placeholder="admin"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-indigo-200 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                placeholder="••••••"
              />
            </div>
            {error && <div className="text-red-300 text-sm text-center">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#4f46e5" }}
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </div>
        </form>

        <p className="text-center text-indigo-300 text-xs mt-4">
          По умолчанию: admin / admin123
        </p>
      </div>
    </div>
  );
}


// ═══ MAIN APP ═══
type Page = "leads" | "chat" | "balance" | "tasks" | "settings";

function MainApp({ currentUser, onLogout }: { currentUser: CRMUser; onLogout: () => void }) {
  // ALL HOOKS FIRST - NO CONDITIONAL RETURNS BEFORE HOOKS
  const { dark, toggle: toggleTheme } = useTheme();
  const [page, setPage] = useState<Page>("leads");
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Data state
  const [leads, setLeads] = useState<Lead[]>(initLeads);
  const [offers, setOffers] = useState<Offer[]>(initOffers);
  const [accounts, setAccounts] = useState<TgAccount[]>(initTgAccounts);
  const [cabinets, setCabinets] = useState<LkCabinet[]>(initCabinets);
  const [messages, setMessages] = useState<ChatMessage[]>(initChatMessages);
  const [tasks, setTasks] = useState<Task[]>(initTasks);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(initQuickReplies);
  const [balanceHistory] = useState<BalanceRecord[]>(initBalanceHistory);
  const [partnerNetworks, setPartnerNetworks] = useState<PartnerNetwork[]>(initPartnerNetworks);
  const [chatLeadId, setChatLeadId] = useState<number | null>(null);

  // Users from localStorage
  const [users, setUsers] = useState<CRMUser[]>(() => {
    try {
      const saved = localStorage.getItem("crm-users");
      if (saved) return JSON.parse(saved);
    } catch { /* empty */ }
    return [{
      id: 1, login: "admin", passwordHash: ADMIN_HASH,
      role: "admin", name: "Администратор",
      allowedAccountIds: [], isBlocked: false,
      createdAt: new Date().toISOString(),
    }];
  });

  // Filter leads for managers
  const visibleLeads = currentUser.role === "admin" || currentUser.allowedAccountIds.length === 0
    ? leads
    : leads.filter(l => currentUser.allowedAccountIds.includes(l.tg_account_id));

  // Request notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Tomorrow delivery notification
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const tomorrowLeads = visibleLeads.filter(l => l.delivery_date === tomorrowStr);
    if (tomorrowLeads.length > 0 && "Notification" in window && Notification.permission === "granted") {
      new Notification("📅 Доставка завтра!", {
        body: `${tomorrowLeads.length} доставок: ${tomorrowLeads.map(l => l.full_name).join(", ")}`,
      });
    }
  }, []);

  // Task notifications (every 30s check)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      tasks.forEach(t => {
        if (t.is_done) return;
        const diff = new Date(t.due_at).getTime() - now;
        if (diff > 0 && diff < 600000 && "Notification" in window && Notification.permission === "granted") {
          new Notification("⏰ Задача скоро!", { body: t.title });
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  const onOpenChat = (leadId: number) => {
    setChatLeadId(leadId);
    setPage("chat");
  };

  // Stats for sidebar
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const totalLeads = visibleLeads.length;
  const newToday = visibleLeads.filter(l => l.created_at.split("T")[0] >= today).length;
  const paidToday = visibleLeads.filter(l => l.paid_date >= today).length;
  const deliveryTomorrow = visibleLeads.filter(l => l.delivery_date === tomorrowStr).length;
  const activeTasks = tasks.filter(t => !t.is_done).length;

  const navItems: { key: Page; icon: string; label: string; badge?: number }[] = [
    { key: "leads", icon: "👥", label: "Лиды" },
    { key: "chat", icon: "💬", label: "Чат" },
    { key: "balance", icon: "💰", label: "Баланс" },
    { key: "tasks", icon: "✅", label: "Задачи", badge: activeTasks },
    { key: "settings", icon: "⚙️", label: "Настройки" },
  ];

  return (
    <div className="flex h-screen" style={{ background: "var(--bg-main)" }}>
      {/* SIDEBAR - Desktop */}
      <aside
        className={`hidden md:flex flex-col crm-sidebar transition-all ${collapsed ? "w-16" : "w-64"}`}
        style={{ flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-2xl">💳</span>
          {!collapsed && <span className="font-bold text-sm" style={{ color: "var(--text-main)" }}>TG Card CRM</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-sm cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 space-y-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => { setPage(item.key); if (item.key !== "chat") setChatLeadId(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all ${collapsed ? "justify-center" : ""}`}
              style={{
                background: page === item.key ? "var(--accent)" : "transparent",
                color: page === item.key ? "#fff" : "var(--text-sub)",
              }}
            >
              <span className="text-lg relative">
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Stats */}
        {!collapsed && (
          <div className="px-4 py-3 space-y-1" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Статистика</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Всего", value: totalLeads, icon: "📊" },
                { label: "Новых", value: newToday, icon: "🆕" },
                { label: "Оплат", value: paidToday, icon: "💸" },
                { label: "Доставок", value: deliveryTomorrow, icon: "📦" },
              ].map(s => (
                <div key={s.label} className="px-2 py-1.5 rounded-lg" style={{ background: "var(--bg-main)" }}>
                  <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.icon} {s.label}</div>
                  <div className="text-sm font-bold" style={{ color: "var(--text-main)" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <div className="px-4 py-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all ${collapsed ? "justify-center" : ""}`}
            style={{ color: "var(--text-sub)" }}
          >
            <span>{dark ? "☀️" : "🌙"}</span>
            {!collapsed && <span>{dark ? "Светлая" : "Тёмная"}</span>}
          </button>
        </div>

        {/* Profile */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#4f46e5" }}>
              {currentUser.name.charAt(0)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: "var(--text-main)" }}>{currentUser.name}</div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{currentUser.role}</div>
              </div>
            )}
            <button onClick={onLogout} className="text-sm cursor-pointer" style={{ color: "var(--text-muted)" }} title="Выйти">🚪</button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {page === "leads" && (
            <LeadsPage
              leads={visibleLeads}
              setLeads={setLeads}
              accounts={accounts}
              offers={offers}
              cabinets={cabinets}
              dark={dark}
              onOpenChat={onOpenChat}
            />
          )}
          {page === "chat" && (
            <ChatPage
              leads={visibleLeads}
              setLeads={setLeads}
              accounts={accounts}
              messages={messages}
              setMessages={setMessages}
              quickReplies={quickReplies}
              dark={dark}
              initialLeadId={chatLeadId}
            />
          )}
          {page === "balance" && (
            <BalancePage
              accounts={accounts}
              offers={offers}
              leads={visibleLeads}
              balanceHistory={balanceHistory}
            />
          )}
          {page === "tasks" && (
            <TasksPage
              tasks={tasks}
              setTasks={setTasks}
              leads={visibleLeads}
              accounts={accounts}
            />
          )}
          {page === "settings" && currentUser.role === "admin" && (
            <SettingsPage
              offers={offers}
              setOffers={setOffers}
              accounts={accounts}
              setAccounts={setAccounts}
              partnerNetworks={partnerNetworks}
              setPartnerNetworks={setPartnerNetworks}
              cabinets={cabinets}
              setCabinets={setCabinets}
              quickReplies={quickReplies}
              setQuickReplies={setQuickReplies}
              users={users}
              setUsers={setUsers}
              dark={dark}
            />
          )}
          {page === "settings" && currentUser.role !== "admin" && (
            <div className="flex items-center justify-center py-16">
              <p style={{ color: "var(--text-muted)" }}>⛔ Доступ только для администраторов</p>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-2 crm-sidebar"
        style={{ borderTop: "1.5px solid var(--border)", zIndex: 1000 }}
      >
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => { setPage(item.key); if (item.key !== "chat") setChatLeadId(null); }}
            className="flex flex-col items-center gap-0.5 px-2 py-1 cursor-pointer transition-all"
            style={{ color: page === item.key ? "var(--accent)" : "var(--text-muted)" }}
          >
            <span className="text-xl relative">
              {item.icon}
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}


// ═══ APP ═══
export function App() {
  const [currentUser, setCurrentUser] = useState<CRMUser | null>(() => {
    try {
      const saved = localStorage.getItem("crm-current-user");
      if (saved) return JSON.parse(saved);
    } catch { /* empty */ }
    return null;
  });

  const handleLogin = (user: CRMUser) => {
    setCurrentUser(user);
    localStorage.setItem("crm-current-user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("crm-current-user");
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <MainApp currentUser={currentUser} onLogout={handleLogout} />;
}

export default App;
