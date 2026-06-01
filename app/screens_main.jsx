/* ============================================================
   screens_main.jsx — 首页 Home · 记账 Ledger
   ============================================================ */

/* ---------- 顶部分类占比条 ---------- */
function CatBar({ totals }) {
  const total = totals.reduce((a, c) => a + c.total, 0);
  if (total <= 0) return null;
  return (
    <div className="catbar">
      <div className="catbar__track">
        {totals.map(c => (
          <div key={c.id} title={c.name} style={{ width: (c.total / total * 100) + '%', background: c.color }} />
        ))}
      </div>
      <div className="catbar__legend">
        {totals.slice(0, 4).map(c => (
          <span key={c.id} className="catbar__leg"><Dot color={c.color} size={7} />{c.name} {Math.round(c.total / total * 100)}%</span>
        ))}
      </div>
    </div>
  );
}

/* ---------- 首页 ---------- */
function HomeScreen({ state, month, openEntry, goTab }) {
  const txs = monthTxs(state, month);
  const cfc = computeCashflow(state, month);
  const totals = categoryTotals(txs);
  const today = todayISO();
  const todayTxs = txs.filter(t => t.date === today);
  const todayTotal = sum(todayTxs, t => Number(t.amount));
  const inThisMonth = monthOf(today) === month;

  return (
    <div className="screen">
      <header className="phead">
        <div>
          <div className="phead__kicker">{inThisMonth ? `今天 · ${fmtDay(today)} ${weekday(today)}` : fmtMonth(month)}</div>
          <h1 className="phead__title">记账</h1>
        </div>
      </header>

      {/* 概览 + 仪表盘 */}
      <div className="home-grid">
        <div className="hero hero--home ga-hero">
          <div className="hero__main">
            <div className="hero__label">本月可动用结余</div>
            <div className={'hero__num' + (cfc.balance < 0 ? ' is-neg' : '')}>{won(cfc.balance)}</div>
            <div className="hero__sub">
              可用现金 {won(cfc.cf.availableCash)} <span className="dotsep">·</span> 本月已花 {won(cfc.totalDaily)}
            </div>
          </div>
          <div className="hero__side">
            <div className="hero__bars">
              <div className="hero__stat">
                <span>新增消费</span><strong>{won(cfc.newSpending)}</strong>
              </div>
              <div className="hero__stat">
                <span>信用卡还款</span><strong>{won(cfc.cf.cardRepayment)}</strong>
              </div>
              <div className="hero__stat">
                <span>现金流出</span><strong>{won(cfc.cashOut)}</strong>
              </div>
            </div>
            <button className="hero__link" onClick={() => goTab('cashflow')}>
              查看现金流总览 <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>

        {/* 快速记一笔 */}
        <button className="quickadd ga-quick" onClick={() => openEntry()}>
          <span className="quickadd__plus"><Icon name="plus" size={22} /></span>
          <span className="quickadd__body">
            <span className="quickadd__txt">记一笔</span>
            <span className="quickadd__hint">吃饭 · 咖啡 · 交通 …</span>
          </span>
          <span className="quickadd__cats">
            {CATEGORIES.map(c => <i key={c.id} style={{ background: c.color }} />)}
          </span>
        </button>

        {/* 今日 */}
        <section className="block ga-today">
          <div className="block__head">
            <h2>{inThisMonth ? '今日' : '最近'}</h2>
            <span className="block__meta">{inThisMonth ? won(todayTotal) : `${txs.length} 笔`}</span>
          </div>
          {(inThisMonth ? todayTxs : txs.slice(0, 4)).length === 0 ? (
            <div className="empty">还没有记录，<button className="linkbtn" onClick={() => openEntry()}>记第一笔</button></div>
          ) : (
            <div className="txlist">
              {(inThisMonth ? todayTxs : txs.slice(0, 4)).map(t => <TxRow key={t.id} t={t} onClick={() => openEntry(t)} />)}
            </div>
          )}
        </section>

        {/* 本月去向 */}
        {totals.length > 0 && (
          <section className="block ga-aside">
            <div className="block__head">
              <h2>本月去向</h2>
              <button className="linkbtn" onClick={() => goTab('stats')}>全部统计</button>
            </div>
            <CatBar totals={totals} />
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------- 单条记录行 ---------- */
function TxRow({ t, onClick }) {
  const c = CAT_MAP[t.category] || { name: '其他', color: '#999' };
  return (
    <button className="tx" onClick={onClick}>
      <Dot color={c.color} size={11} />
      <div className="tx__main">
        <div className="tx__cat">{c.name}</div>
        {t.note && <div className="tx__note">{t.note}</div>}
      </div>
      <div className="tx__amt">−{won(t.amount).slice(1)}</div>
    </button>
  );
}

/* ---------- 记账页 ---------- */
function LedgerScreen({ state, month, openEntry }) {
  const txs = monthTxs(state, month);
  const groups = groupByDay(txs);
  const total = sum(txs, t => Number(t.amount));
  const avg = total / Math.max(1, new Set(txs.map(t => t.date)).size);

  return (
    <div className="screen">
      <header className="phead">
        <div>
          <div className="phead__kicker">{fmtMonth(month)}</div>
          <h1 className="phead__title">每日记账</h1>
        </div>
      </header>

      <div className="summary">
        <div className="summary__cell">
          <span>本月合计</span>
          <strong>{won(total)}</strong>
        </div>
        <div className="summary__cell">
          <span>记账天数</span>
          <strong>{new Set(txs.map(t => t.date)).size} 天</strong>
        </div>
        <div className="summary__cell">
          <span>日均</span>
          <strong>{won(avg)}</strong>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="empty empty--big">
          本月还没有记录<br />
          <button className="btn btn--primary" onClick={() => openEntry()} style={{ marginTop: 14 }}>
            <Icon name="plus" size={18} /> 记一笔
          </button>
        </div>
      ) : groups.map(g => (
        <section className="day" key={g.date}>
          <div className="day__head">
            <div className="day__date">
              <span className="day__num">{fmtDay(g.date)}</span>
              <span className="day__wk">{weekday(g.date)}</span>
            </div>
            <div className="day__total">{won(g.total)}</div>
          </div>
          <div className="txlist">
            {g.items.map(t => <TxRow key={t.id} t={t} onClick={() => openEntry(t)} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

Object.assign(window, { HomeScreen, LedgerScreen, TxRow, CatBar });
