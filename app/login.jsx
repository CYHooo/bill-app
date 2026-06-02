/* ============================================================
   login.jsx — 登录界面（仅在启用 Firebase Auth 时显示）
   ============================================================ */

function mapAuthErr(e) {
  const c = (e && e.code) || '';
  if (c.includes('wrong-password') || c.includes('invalid-credential') || c.includes('invalid-login')) return '邮箱或密码不对';
  if (c.includes('user-not-found')) return '没有这个账号';
  if (c.includes('invalid-email')) return '邮箱格式不对';
  if (c.includes('too-many-requests')) return '尝试太多次了，稍后再试';
  if (c.includes('network')) return '网络连接失败，检查一下网络';
  return '登录失败，请重试';
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    if (e) e.preventDefault();
    if (busy || !email || !pwd) return;
    setBusy(true); setErr('');
    window.LedgerAuth.signIn(email.trim(), pwd)
      .catch(er => { setErr(mapAuthErr(er)); setBusy(false); });
    // 成功后由 onAuthStateChanged 切换到 App，无需在此处理
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__mark">₩</div>
        <h1 className="login__title">记账</h1>
        <p className="login__sub">登录后查看你的账目</p>

        <input className="login__field" type="email" inputMode="email" autoComplete="username"
          placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
        <input className="login__field" type="password" autoComplete="current-password"
          placeholder="密码" value={pwd} onChange={e => setPwd(e.target.value)} />

        {err && <div className="login__err">{err}</div>}

        <button className="btn btn--primary login__btn" type="submit" disabled={busy || !email || !pwd}>
          {busy ? '登录中…' : '登录'}
        </button>
        <div className="login__hint">仅限本人 · 账号在 Firebase 后台创建</div>
      </form>
    </div>
  );
}

Object.assign(window, { LoginScreen, mapAuthErr });
