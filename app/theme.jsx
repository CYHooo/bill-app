/* ============================================================
   theme.jsx — 配色：雾岩灰（浅） / 雾岩灰·夜（深）
   配色用 CSS [data-theme] 规则（见 记账.html）。这里只管：
   应用 / 记住选择（localStorage）、浅↔深一键切换。
   ============================================================ */

const THEME_META = {
  stone:     { card: '#232830', dark: false },
  stoneDark: { card: '#181B20', dark: true  },
};

function isDarkTheme(id) { return !!(THEME_META[id] && THEME_META[id].dark); }
function counterpart(id) { return isDarkTheme(id) ? 'stone' : 'stoneDark'; }

const THEME_KEY = 'ledger.theme';
function readTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return THEME_META[t] ? t : 'stone';
  } catch (e) { return 'stone'; }
}
function applyTheme(id) {
  if (!THEME_META[id]) id = 'stone';
  document.documentElement.setAttribute('data-theme', id);
  try { localStorage.setItem(THEME_KEY, id); } catch (e) {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META[id].card);
}

/* 日/夜切换按钮（顶栏） */
function ModeToggle({ theme, onToggle }) {
  const dark = isDarkTheme(theme);
  return (
    <button className="modetoggle" onClick={onToggle}
      title={dark ? '切换浅色' : '切换深色'} aria-label="切换深色/浅色主题">
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
    </button>
  );
}

Object.assign(window, { THEME_META, isDarkTheme, counterpart, readTheme, applyTheme, ModeToggle });
