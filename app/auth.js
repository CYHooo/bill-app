/* ============================================================
   auth.js — 可选的登录（Firebase Authentication）
   ------------------------------------------------------------
   配置了 window.LEDGER_FIREBASE 且引入了 firebase-auth SDK 时启用。
   未配置则不启用：App 直接进入（纯本地模式，数据只在你自己浏览器里，
   别人访问网址也只会看到他们自己的空白本地数据）。

   开启"只有我能看"的私密版（详见 README）：
   1) Firebase 控制台 → Authentication → 开启「电子邮件/密码」登录方式；
      在 Users 里「Add user」建一个你自己的账号（邮箱 + 密码）。复制它的 UID。
   2) Firestore 规则改成只认你的 UID：
        match /ledger/{doc} {
          allow read, write: if request.auth != null
                             && request.auth.uid == '你的UID';
        }
   3) index.html 里在 firestore SDK 之后再加一行 auth SDK：
        <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
   这样打开网站会先要求登录，只有你的账号能进、能读写。
   ============================================================ */
(function () {
  var cfg = window.LEDGER_FIREBASE;
  if (!cfg || !cfg.config || !window.firebase || !firebase.auth) return; // 未配置 → 不启用登录

  try { if (!firebase.apps.length) firebase.initializeApp(cfg.config); } catch (e) { return; }

  var auth = firebase.auth();
  try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}

  window.LedgerAuth = {
    enabled: true,
    user: null,
    onChange: function (cb) {
      auth.onAuthStateChanged(function (u) { window.LedgerAuth.user = u; cb(u); });
    },
    signIn: function (email, pwd) { return auth.signInWithEmailAndPassword(email, pwd); },
    signOut: function () { return auth.signOut(); },
  };
})();
