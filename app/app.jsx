/* ============================================================
   app.jsx — 应用外壳：响应式导航 · 月份切换 · 录入弹层 · 挂载
   ============================================================ */

const NAV = [
  { id: 'home',     label: '首页',   icon: 'home' },
  { id: 'ledger',   label: '记账',   icon: 'book' },
  { id: 'cashflow', label: '现金流', icon: 'wallet' },
  { id: 'stats',    label: '统计',   icon: 'chart' },
];

function MonthSwitcher({ month, setMonth }) {
  return (
    <div className="msw">
      <button className="msw__btn" onClick={() => setMonth(addMonth(month, -1))} aria-label="上个月"><Icon name="left" size={18} /></button>
      <span className="msw__label">{fmtMonth(month)}</span>
      <button className="msw__btn" onClick={() => setMonth(addMonth(month, 1))} aria-label="下个月"><Icon name="right" size={18} /></button>
    </div>
  );
}

function LedgerApp() {
  const store = useStore();
  const [tab, setTab] = useState('home');
  const [month, setMonth] = useState(monthOf(todayISO()));
  const [entry, setEntry] = useState({ open: false, tx: null });
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggleMode = () => setTheme(t => counterpart(t));

  const authOn = !!(window.LedgerAuth && window.LedgerAuth.enabled);
  const signOut = () => { if (window.LedgerAuth) window.LedgerAuth.signOut(); };

  const openEntry = (tx) => setEntry({ open: true, tx: tx || null });
  const closeEntry = () => setEntry(e => ({ ...e, open: false }));

  const saveEntry = (data) => {
    if (entry.tx && entry.tx.id) store.updateTx(entry.tx.id, data);
    else store.addTx(data);
    // 记到某一天 -> 自动切到该天所在月份
    setMonth(monthOf(data.date));
  };

  const screen = (() => {
    const p = { state: store.state, month };
    switch (tab) {
      case 'home':     return <HomeScreen {...p} openEntry={openEntry} goTab={setTab} />;
      case 'ledger':   return <LedgerScreen {...p} openEntry={openEntry} />;
      case 'cashflow': return <CashflowScreen {...p} setCashflow={store.setCashflow} />;
      case 'stats':    return <StatsScreen {...p} />;
      default:         return null;
    }
  })();

  return (
    <div className="app">
      {/* 桌面侧栏 */}
      <aside className="sidenav">
        <div className="brand">
          <div className="brand__mark">₩</div>
          <div className="brand__txt">
            <div className="brand__name">记账</div>
            <div className="brand__sub">个人现金流</div>
          </div>
        </div>
        <nav className="sidenav__nav">
          {NAV.map(n => (
            <button key={n.id} className={'navitem' + (tab === n.id ? ' navitem--on' : '')} onClick={() => setTab(n.id)}>
              <Icon name={n.icon} size={20} /><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <button className="btn btn--primary btn--full sidenav__add" onClick={() => openEntry()}>
          <Icon name="plus" size={18} /> 记一笔
        </button>
        <div className="sidenav__foot">
          <SyncBadge />
        </div>
      </aside>

      {/* 主区 */}
      <main className="main">
        <div className="topbar">
          <div className="topbar__brand"><span className="topbar__mark">₩</span> 记账</div>
          <div className="topbar__right">
            {authOn && <button className="modetoggle" onClick={signOut} title="退出登录" aria-label="退出登录"><Icon name="logout" size={18} /></button>}
            <ModeToggle theme={theme} onToggle={toggleMode} />
            <MonthSwitcher month={month} setMonth={setMonth} />
          </div>
        </div>
        <div className="content" key={tab}>
          {screen}
        </div>
      </main>

      {/* 移动端浮动按钮 */}
      <button className="fab" onClick={() => openEntry()} aria-label="记一笔"><Icon name="plus" size={26} /></button>

      {/* 移动端底部 Tab */}
      <nav className="tabbar">
        {NAV.map(n => (
          <button key={n.id} className={'tab' + (tab === n.id ? ' tab--on' : '')} onClick={() => setTab(n.id)}>
            <span className="tab__ic"><Icon name={n.icon} size={22} /></span><span>{n.label}</span>
          </button>
        ))}
      </nav>

      <EntrySheet open={entry.open} onClose={closeEntry} initial={entry.tx}
        onSave={saveEntry} onDelete={store.deleteTx} />
    </div>
  );
}

/* 同步状态徽标（本地版显示“本地保存”；接入云后显示“已同步”） */
function SyncBadge() {
  const cloud = !!(window.LedgerCloud && window.LedgerCloud.enabled);
  const demo = cloud && typeof window.LedgerCloud.isDemoUser === 'function'
    && window.LedgerCloud.isDemoUser();
  return (
    <div className="syncbadge">
      <span className="syncbadge__dot" />
      {demo ? '本地演示'
        : cloud ? '已云同步'
        : '本地保存 · 刷新不丢'}
    </div>
  );
}

/* 鉴权门：启用 Firebase 登录时，未登录显示登录界面 */
function App() {
  const authOn = !!(window.LedgerAuth && window.LedgerAuth.enabled);
  const [phase, setPhase] = useState(authOn ? 'loading' : 'in');

  useEffect(() => {
    if (!authOn) return;
    window.LedgerAuth.onChange(u => setPhase(u ? 'in' : 'out'));
  }, []);

  if (phase === 'loading') {
    return <div className="boot">载入中…</div>;
  }
  if (phase === 'out') {
    return <LoginScreen />;
  }
  return <LedgerApp />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
