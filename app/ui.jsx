/* ============================================================
   ui.jsx — 共用 UI 组件
   图标 · 底部弹层 Sheet · 分类色点 · 环形图 Donut · 金额录入
   ============================================================ */

/* ---------- 极简线性图标（仅用基础描边形状） ---------- */
function Icon({ name, size = 22, stroke = 1.6 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return (<svg {...p}><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10.5V19h12v-8.5" /></svg>);
    case 'book': return (<svg {...p}><rect x="5" y="4" width="14" height="16" rx="1.5" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>);
    case 'wallet': return (<svg {...p}><rect x="4" y="6" width="16" height="13" rx="2.5" /><path d="M4 9h16" /><circle cx="16.5" cy="13" r="1.1" fill="currentColor" stroke="none" /></svg>);
    case 'chart': return (<svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 12 12 4M12 12l6.5 3.5" /></svg>);
    case 'plus': return (<svg {...p}><path d="M12 5v14M5 12h14" /></svg>);
    case 'close': return (<svg {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
    case 'left': return (<svg {...p}><path d="M15 5l-7 7 7 7" /></svg>);
    case 'right': return (<svg {...p}><path d="M9 5l7 7-7 7" /></svg>);
    case 'check': return (<svg {...p}><path d="M5 12.5 10 17l9-10" /></svg>);
    case 'trash': return (<svg {...p}><path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12" /></svg>);
    case 'edit': return (<svg {...p}><path d="M5 19h14M7 15l8-8 2 2-8 8H7z" /></svg>);
    case 'arrow': return (<svg {...p}><path d="M5 12h14M14 7l5 5-5 5" /></svg>);
    case 'sun': return (<svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>);
    case 'moon': return (<svg {...p}><path d="M17.5 13.8A6.5 6.5 0 0 1 10.2 6.5c0-.9.2-1.7.5-2.5a7 7 0 1 0 9.3 9.3c-.8.3-1.6.5-2.5.5z" /></svg>);
    default: return null;
  }
}

function Dot({ color, size = 10 }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block', flex: '0 0 auto' }} />;
}

/* ---------- 底部弹层 ---------- */
function Sheet({ open, onClose, children, title, wide }) {
  useEffect(() => {
    if (!open) return;
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className={'sheet' + (wide ? ' sheet--wide' : '')} onClick={e => e.stopPropagation()}>
        <div className="sheet__grab" />
        {title && (
          <div className="sheet__head">
            <h3>{title}</h3>
            <button className="iconbtn" onClick={onClose} aria-label="关闭"><Icon name="close" size={20} /></button>
          </div>
        )}
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}

/* ---------- 环形图（基础 SVG 弧） ---------- */
function Donut({ data, size = 168, thickness = 26, centerTop, centerBottom }) {
  const total = data.reduce((a, d) => a + d.total, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring)" strokeWidth={thickness} />
        {total > 0 && data.map((d, i) => {
          const frac = d.total / total;
          const seg = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={d.color} strokeWidth={thickness}
              strokeDasharray={`${frac * c} ${c}`} strokeDashoffset={-acc * c}
              strokeLinecap="butt" />
          );
          acc += frac;
          return seg;
        })}
      </svg>
      <div className="donut__center">
        <div className="donut__top">{centerTop}</div>
        <div className="donut__bottom">{centerBottom}</div>
      </div>
    </div>
  );
}

/* ---------- 金额录入弹层（快速记一笔 / 编辑） ---------- */
function EntrySheet({ open, onClose, onSave, onDelete, initial }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setAmount(String(initial.amount || ''));
      setCategory(initial.category || 'food');
      setDate(initial.date || todayISO());
      setNote(initial.note || '');
    } else {
      setAmount(''); setCategory('food'); setDate(todayISO()); setNote('');
    }
  }, [open, initial]);

  const press = (k) => {
    setAmount(a => {
      if (k === 'del') return a.slice(0, -1);
      if (k === '000') return a === '' ? a : (a + '000').slice(0, 12);
      if (a.length >= 12) return a;
      if (a === '0') return k;
      return a + k;
    });
  };
  const amt = Number(amount) || 0;
  const editing = !!(initial && initial.id);

  const save = () => {
    if (amt <= 0) return;
    onSave({ amount: amt, category, date, note: note.trim() });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={editing ? '编辑一笔' : '记一笔'}>
      <div className="entry">
        <div className="entry__amount">
          <span className="entry__cur">₩</span>
          <span className="entry__val">{amt ? amt.toLocaleString('en-US') : <span className="entry__ph">0</span>}</span>
        </div>

        <div className="cats">
          {CATEGORIES.map(c => (
            <button key={c.id}
              className={'cat' + (category === c.id ? ' cat--on' : '')}
              onClick={() => setCategory(c.id)}
              style={category === c.id ? { borderColor: c.color, background: c.color + '14' } : null}>
              <Dot color={c.color} size={9} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        <div className="entry__row">
          <input className="field" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <input className="field" type="text" placeholder="备注（可选）" value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="keypad">
          {['1','2','3','4','5','6','7','8','9','000','0','del'].map(k => (
            <button key={k} className={'key' + (k === 'del' ? ' key--del' : '')} onClick={() => press(k)}>
              {k === 'del' ? <Icon name="left" size={20} /> : k}
            </button>
          ))}
        </div>

        <div className="entry__actions">
          {editing && (
            <button className="btn btn--ghost btn--danger" onClick={() => { onDelete(initial.id); onClose(); }}>
              <Icon name="trash" size={18} /> 删除
            </button>
          )}
          <button className="btn btn--primary" disabled={amt <= 0} onClick={save}>
            <Icon name="check" size={18} /> {editing ? '保存' : '记下'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------- 一行可编辑的金额字段（现金流页用） ---------- */
function MoneyRow({ label, sub, value, onChange, color, readOnly, strong, accent, after }) {
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState('');
  const commit = () => { onChange && onChange(Number(tmp.replace(/[^\d-]/g, '')) || 0); setEditing(false); };
  return (
    <div className={'mrow' + (strong ? ' mrow--strong' : '')}>
      <div className="mrow__l">
        {color && <Dot color={color} size={8} />}
        <div>
          <div className="mrow__label">{label}</div>
          {sub && <div className="mrow__sub">{sub}</div>}
        </div>
      </div>
      <div className="mrow__r">
        {readOnly ? (
          <div className={'mrow__val' + (accent ? ' mrow__val--accent' : '')} style={accent ? { color: accent } : null}>{won(value)}</div>
        ) : editing ? (
          <input className="mrow__input" autoFocus value={tmp}
            onChange={e => setTmp(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} />
        ) : (
          <button className="mrow__val mrow__val--edit" onClick={() => { setTmp(String(value || '')); setEditing(true); }}>
            {won(value)}
          </button>
        )}
        {after}
      </div>
    </div>
  );
}

Object.assign(window, { Icon, Dot, Sheet, Donut, EntrySheet, MoneyRow });
