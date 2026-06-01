/* ============================================================
   screens_plan.jsx — 现金流 Cashflow · 统计 Stats
   ============================================================ */

/* ---------- 现金流总览 ---------- */
function CashflowScreen({ state, month, setCashflow }) {
  const { cf, transportSpending, dailySpending, fixed, newSpending, cashOut, balance,
    availableCash, autoCash, prevMonth, prevBalance, prevSalary } = computeCashflow(state, month);
  const set = (k) => (v) => setCashflow(month, { [k]: v });

  return (
    <div className="screen">
      <header className="phead">
        <div>
          <div className="phead__kicker">{fmtMonth(month)}</div>
          <h1 className="phead__title">现金流总览</h1>
        </div>
      </header>

      {/* 可动用结余 大数 */}
      <div className="hero hero--plan">
        <div className="hero__label">本月可动用结余</div>
        <div className={'hero__num' + (balance < 0 ? ' is-neg' : '')}>{won(balance)}</div>
        <div className="hero__sub">可用现金 − 现金流出 · 结转进下月</div>
      </div>

      {/* 可用现金 */}
      <section className="panel">
        <MoneyRow strong label="本月可用现金"
          sub={autoCash
            ? `自 ${fmtMonth(prevMonth)} 结转：结余 ${won(prevBalance)} + 工资 ${won(prevSalary)}`
            : '手动设置（点数字可改）'}
          value={availableCash} onChange={set('availableCash')}
          after={!autoCash && (
            <button className="mrow__reset" onClick={() => setCashflow(month, { availableCash: null })}>
              ↺ 自动结转
            </button>
          )} />
      </section>

      {/* 新增消费 */}
      <div className="panel__title">本月新增消费<span>实际花掉的</span></div>
      <section className="panel">
        <MoneyRow label="房租" value={cf.rent} onChange={set('rent')} />
        <MoneyRow label="管理费" value={cf.mgmt} onChange={set('mgmt')} />
        <MoneyRow label="话费 + 网费" value={cf.phone} onChange={set('phone')} />
        <MoneyRow label="交通" sub="自动汇总每日记账·交通" value={transportSpending} readOnly color="#7E9A77" />
        <MoneyRow label="日常花销" sub="自动汇总每日记账（不含交通）" value={dailySpending} readOnly color="#C2784F" />
        <MoneyRow label="① 本月新增消费合计" value={newSpending} readOnly strong />
      </section>

      {/* 信用卡还款 */}
      <div className="panel__title">信用卡还款<span>上月刷的，本月还</span></div>
      <section className="panel">
        <MoneyRow label="信用卡账单还款" sub="上月刷的（含分期），本月还" value={cf.cardRepayment} onChange={set('cardRepayment')} />
      </section>

      {/* 汇总 */}
      <div className="panel__title">现金流汇总</div>
      <section className="panel">
        <MoneyRow label="② 本月现金流出合计" sub="① 新增消费 + 信用卡还款" value={cashOut} readOnly strong />
        <MoneyRow label="本月可动用结余" sub="可用现金 − ②" value={balance} readOnly accent={balance < 0 ? '#B5503F' : '#3E7A52'} strong />
      </section>

      {/* 月末工资 */}
      <div className="panel__title">月末发薪<span>自动结转下月</span></div>
      <section className="panel">
        <MoneyRow label="本月底发薪" sub="月末 27–30 号发，下月可用现金会自动算上它" value={cf.salary} onChange={set('salary')} />
      </section>

      {/* 说明 */}
      <div className="note">
        <p><b>两类钱分开看：</b>① 新增消费 = 你本月真正的花钱习惯；信用卡还款 = 还上个月刷的旧账。</p>
        <p>② 现金流出 = ① + 还款，才是本月实际流出的现金，决定月底剩多少。</p>
        <p><b>自动结转：</b>下月「可用现金」= 本月可动用结余 + 本月底发薪，无需手动操作。
           需要时也可点「可用现金」数字手动覆盖（比如某月有额外收入）。</p>
      </div>
    </div>
  );
}

/* ---------- 日支出柱状图 ---------- */
function DayBars({ data }) {
  const max = Math.max(1, ...data.map(d => d.total));
  const today = todayISO();
  return (
    <div className="bars">
      {data.map((d, i) => {
        const day = parseISO(d.day).getDate();
        const isToday = d.day === today;
        const showLab = day === 1 || day % 5 === 0;
        return (
          <div className="bars__col" key={i} title={`${fmtDay(d.day)} · ${won(d.total)}`}>
            <div className="bars__track">
              <div className={'bars__fill' + (isToday ? ' is-today' : '')}
                style={{ height: d.total > 0 ? Math.max(3, d.total / max * 100) + '%' : '0' }} />
            </div>
            <span className="bars__lab">{showLab ? day : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 统计页 ---------- */
function StatsScreen({ state, month }) {
  const txs = monthTxs(state, month);
  const totals = categoryTotals(txs);
  const total = sum(txs, t => Number(t.amount));
  const days = dailyTotals(txs, month);
  const activeDays = new Set(txs.map(t => t.date)).size;
  const avg = total / Math.max(1, activeDays);
  const biggest = txs.slice().sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="screen">
      <header className="phead">
        <div>
          <div className="phead__kicker">{fmtMonth(month)}</div>
          <h1 className="phead__title">统计</h1>
        </div>
      </header>

      {total === 0 ? (
        <div className="empty empty--big">本月还没有数据</div>
      ) : (
        <>
          {/* 分类占比 */}
          <section className="card">
            <div className="card__title">钱花哪了</div>
            <div className="stats__donut">
              <Donut data={totals}
                centerTop="本月支出"
                centerBottom={<span className="donut__amt">{won(total)}</span>} />
              <div className="legend">
                {totals.map(c => (
                  <div className="legend__row" key={c.id}>
                    <Dot color={c.color} size={9} />
                    <span className="legend__name">{c.name}</span>
                    <span className="legend__pct">{Math.round(c.total / total * 100)}%</span>
                    <span className="legend__amt">{won(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 趋势 */}
          <section className="card">
            <div className="card__title">每日支出趋势</div>
            <DayBars data={days} />
          </section>

          {/* 关键数字 */}
          <section className="kpis">
            <div className="kpi"><span>日均</span><strong>{won(avg)}</strong></div>
            <div className="kpi"><span>记账天数</span><strong>{activeDays} 天</strong></div>
            <div className="kpi"><span>笔数</span><strong>{txs.length}</strong></div>
            {biggest && <div className="kpi"><span>最大一笔</span><strong>{won(biggest.amount)}</strong><em>{CAT_MAP[biggest.category]?.name}</em></div>}
          </section>
        </>
      )}
    </div>
  );
}

Object.assign(window, { CashflowScreen, StatsScreen, DayBars });
