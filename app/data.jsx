/* ============================================================
   data.jsx — 数据层
   分类定义 · 韩元格式化 · 本地持久化 store · 现金流计算
   全部挂到 window，供其它脚本使用
   ============================================================ */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ---------- 分类 ---------- */
const CATEGORIES = [
  { id: 'food',      name: '吃饭',      color: '#C2784F' },
  { id: 'coffee',    name: '咖啡',      color: '#9C7B5C' },
  { id: 'social',    name: '喝酒/社交', color: '#A66B7C' },
  { id: 'transport', name: '交通',      color: '#7E9A77' },
  { id: 'fun',       name: '娱乐',      color: '#C0A24E' },
  { id: 'shopping',  name: '购物/其他', color: '#6E8CA0' },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

/* ---------- 韩元格式化 ---------- */
function won(n) {
  const v = Math.round(Number(n) || 0);
  return '₩' + v.toLocaleString('en-US');
}
function wonShort(n) {
  // 简短显示：1,250,000 -> 125만
  const v = Math.round(Number(n) || 0);
  if (Math.abs(v) >= 10000) {
    const man = v / 10000;
    const s = (Math.abs(man) >= 100 ? Math.round(man) : Math.round(man * 10) / 10);
    return s.toLocaleString('en-US') + '만';
  }
  return v.toLocaleString('en-US');
}

/* ---------- 日期工具 ---------- */
const WK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function todayISO() {
  return iso(new Date()); // 真实当前日期（随系统时间）
}
function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function monthOf(isoStr) { return isoStr.slice(0, 7); }           // '2026-06'
function fmtMonth(m) { const [y, mm] = m.split('-'); return `${Number(y)}年${Number(mm)}月`; }
function fmtDay(isoStr) { const d = parseISO(isoStr); return `${d.getMonth() + 1}/${d.getDate()}`; }
function weekday(isoStr) { return WK[parseISO(isoStr).getDay()]; }
function addMonth(m, delta) {
  const [y, mm] = m.split('-').map(Number);
  const d = new Date(y, mm - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function daysInMonth(m) { const [y, mm] = m.split('-').map(Number); return new Date(y, mm, 0).getDate(); }

/* ---------- 默认现金流配置 ---------- */
// Fixed monthly bills default to the user's baseline amounts; any month-level
// override stored on state.cashflow[month] still wins via spread order.
function blankCashflow() {
  return {
    rent: 500000, mgmt: 100000, phone: 88000,
    cardRepayment: 0,
    salary: 4400000,
  };
}

/* ---------- 初始空库（首次打开 / 清空数据时使用） ---------- */
function emptyState() {
  return {
    transactions: [],
    cashflow: {},
    settings: { savingGoal: 0 },
  };
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ---------- 演示种子数据（每次 demo 加载都随机生成一份） ---------- */
// Randomized each call so refreshing the demo session yields a fresh
// sample ledger; anchored to the current month for realism.
function demoSeed() {
  const today = new Date();
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const maxDay = today.getDate();

  const POOLS = {
    food:      { range: [8000, 30000],  notes: ['公司附近午饭', '便利店便当', '晚饭', '烤肉', '韩餐', '拌饭', '炸鸡', '泡菜汤', '麻辣烫'] },
    coffee:    { range: [3500, 6500],   notes: ['美式', '拿铁', '冰美式', '卡布奇诺', '抹茶拿铁', '手冲'] },
    social:    { range: [25000, 80000], notes: ['朋友聚餐 AA', '小酌', '生日聚会', 'KTV', '酒吧'] },
    transport: { range: [1500, 8000],   notes: ['地铁往返', '打车', '公交', '出租车'] },
    fun:       { range: [10000, 35000], notes: ['电影', '游戏', '展览', '密室逃脱', '书店', '健身房'] },
    shopping:  { range: [15000, 60000], notes: ['日用品补货', '衣服', '化妆品', '电子配件', '书籍', '家居小物'] },
  };
  const CATS = Object.keys(POOLS);
  const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[randInt(0, arr.length - 1)];

  const n = randInt(8, 15);
  const transactions = [];
  for (let i = 0; i < n; i++) {
    const cat = pick(CATS);
    const p = POOLS[cat];
    const amount = Math.round(randInt(p.range[0], p.range[1]) / 100) * 100;
    transactions.push({
      id: uid(),
      date: `${month}-${String(randInt(1, maxDay)).padStart(2, '0')}`,
      category: cat,
      amount: amount,
      note: pick(p.notes),
    });
  }

  return {
    transactions,
    cashflow: {
      [month]: {
        availableCash:  randInt(30, 60) * 100000,    // ₩3.0M – ₩6.0M
        rent:           randInt(30, 80) * 10000,     // ₩300k – ₩800k
        mgmt:           randInt(5, 20) * 10000,      // ₩50k  – ₩200k
        phone:          randInt(5, 12) * 10000,      // ₩50k  – ₩120k
        cardRepayment:  randInt(8, 18) * 100000,     // ₩800k – ₩1.8M
        salary:         randInt(30, 60) * 100000,    // ₩3.0M – ₩6.0M
      },
    },
    settings: { savingGoal: randInt(5, 20) * 100000 },
  };
}

/* ============================================================
   Store —— 本地持久化 + 操作
   ============================================================ */
const LS_KEY = 'ledger.v1';
const LS_KEY_DEMO_LEGACY = 'ledger.v1.demo';

function isDemoUser() {
  const C = window.LedgerCloud;
  return !!(C && typeof C.isDemoUser === 'function' && C.isDemoUser());
}

// Demo sessions are intentionally volatile: every page load regenerates
// a fresh random seed and nothing gets written to localStorage, so the
// owner's cache and the demo session can never bleed into each other.
function loadState() {
  if (isDemoUser()) {
    try { localStorage.removeItem(LS_KEY_DEMO_LEGACY); } catch (e) {}
    return demoSeed();
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return emptyState();
}

function useStore() {
  const [state, setState] = useState(loadState);
  const first = useRef(true);
  const lastSync = useRef(null);

  // 云同步（可选）：配置 window.LedgerCloud 后自动启用，否则纯本地
  useEffect(() => {
    const C = window.LedgerCloud;
    if (!C || !C.enabled) return;
    let alive = true;
    C.load().then(remote => { if (alive && remote) { lastSync.current = JSON.stringify(remote); setState(remote); } });
    C.subscribe(remote => {
      if (!alive || !remote) return;
      const s = JSON.stringify(remote);
      if (s === lastSync.current) return;
      lastSync.current = s;
      setState(remote);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (isDemoUser()) return;  // demo session: in-memory only, no persistence
    const s = JSON.stringify(state);
    try { localStorage.setItem(LS_KEY, s); } catch (e) {}
    const C = window.LedgerCloud;
    if (C && C.enabled && s !== lastSync.current) { lastSync.current = s; C.save(state); }
  }, [state]);

  const addTx = useCallback((t) => {
    setState(s => ({ ...s, transactions: [...s.transactions, { ...t, id: uid() }] }));
  }, []);
  const updateTx = useCallback((id, patch) => {
    setState(s => ({ ...s, transactions: s.transactions.map(t => t.id === id ? { ...t, ...patch } : t) }));
  }, []);
  const deleteTx = useCallback((id) => {
    setState(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) }));
  }, []);
  const setCashflow = useCallback((month, patch) => {
    setState(s => ({
      ...s,
      cashflow: { ...s.cashflow, [month]: { ...blankCashflow(), ...(s.cashflow[month] || {}), ...patch } },
    }));
  }, []);
  const setSetting = useCallback((patch) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);
  const resetAll = useCallback(() => setState(isDemoUser() ? demoSeed() : emptyState()), []);
  const clearAll = useCallback(() => setState(emptyState()), []);

  return { state, addTx, updateTx, deleteTx, setCashflow, setSetting, resetAll, clearAll };
}

/* ---------- 派生选择器 ---------- */
function monthTxs(state, month) {
  return state.transactions
    .filter(t => monthOf(t.date) === month)
    .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
}
function sum(arr, f) { return arr.reduce((a, x) => a + (f ? f(x) : x), 0); }

function categoryTotals(txs) {
  const m = {};
  CATEGORIES.forEach(c => m[c.id] = 0);
  txs.forEach(t => { m[t.category] = (m[t.category] || 0) + Number(t.amount); });
  return CATEGORIES.map(c => ({ ...c, total: m[c.id] })).filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);
}
function dailyTotals(txs, month) {
  const n = daysInMonth(month);
  const arr = [];
  for (let d = 1; d <= n; d++) {
    const day = `${month}-${String(d).padStart(2, '0')}`;
    arr.push({ day, total: sum(txs.filter(t => t.date === day), t => Number(t.amount)) });
  }
  return arr;
}
function groupByDay(txs) {
  const m = {};
  txs.forEach(t => { (m[t.date] = m[t.date] || []).push(t); });
  return Object.keys(m).sort((a, b) => a < b ? 1 : -1).map(date => ({
    date, items: m[date], total: sum(m[date], t => Number(t.amount)),
  }));
}

/* ---------- 现金流计算（连接每日记账 + 自动结转） ----------
   可用现金：未手动设置时 = 上月可动用结余 + 上月工资（递归结转） */
function computeCashflow(state, month, _depth) {
  _depth = _depth || 0;
  const stored = state.cashflow[month] || {};
  const cf = { ...blankCashflow(), ...stored };
  const txs = monthTxs(state, month);
  const transportSpending = sum(txs.filter(t => t.category === 'transport'), t => Number(t.amount)); // 交通（来自记账）
  const dailySpending = sum(txs.filter(t => t.category !== 'transport'), t => Number(t.amount));       // 日常花销（不含交通）
  const totalDaily = transportSpending + dailySpending;                                                // 本月记账总花销
  const fixed = cf.rent + cf.mgmt + cf.phone;
  const newSpending = fixed + transportSpending + dailySpending;   // ① 本月新增消费合计
  const cashOut = newSpending + cf.cardRepayment;                  // ② 本月现金流出合计

  // 可用现金：手动设置优先；否则自上月结转（上月结余 + 上月工资）
  const prevMonth = addMonth(month, -1);
  const autoCash = stored.availableCash == null;
  let availableCash = 0, carriedIn = 0, prevBalance = 0, prevSalary = 0;
  if (!autoCash) {
    availableCash = Number(cf.availableCash) || 0;
  } else if (_depth < 36) {
    const pc = computeCashflow(state, prevMonth, _depth + 1);
    prevBalance = pc.balance;
    prevSalary = pc.cf.salary;
    carriedIn = prevBalance + prevSalary;
    availableCash = carriedIn;
  }

  const balance = availableCash - cashOut;                        // 本月可动用结余
  return {
    cf: { ...cf, availableCash },
    availableCash, autoCash, carriedIn, prevMonth, prevBalance, prevSalary,
    transportSpending, dailySpending, totalDaily, fixed, newSpending, cashOut, balance,
    txCount: txs.length,
  };
}

/* ---------- 导出 ---------- */
Object.assign(window, {
  CATEGORIES, CAT_MAP, won, wonShort, WK,
  todayISO, iso, parseISO, monthOf, fmtMonth, fmtDay, weekday, addMonth, daysInMonth,
  blankCashflow, useStore, uid,
  monthTxs, sum, categoryTotals, dailyTotals, groupByDay, computeCashflow,
});
