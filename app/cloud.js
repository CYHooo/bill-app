/* ============================================================
   cloud.js — 可选的多设备实时同步（Firebase Firestore）
   ------------------------------------------------------------
   默认不启用：没配置时本文件什么都不做，App 走本地保存。
   想开启多设备同步（手机记、电脑实时看），三步（详见 README）：

   1) 去 https://console.firebase.google.com 免费建项目（Spark 计划），
      Build → Firestore Database → 创建。安全规则（个人开放版）：
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /ledger/{doc} { allow read, write: if true; }
          }
        }

   2) 项目设置 → 你的应用 → Web（</>）→ 注册，复制 firebaseConfig。
      在 index.html 的 <head> 里、本脚本之前，加：
        <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
        <script>window.LEDGER_FIREBASE = {
          config: { apiKey:'…', authDomain:'…', projectId:'…',
                    storageBucket:'…', messagingSenderId:'…', appId:'…' },
          row: '只有你知道的随机串'   // 例如 myledger-9f3a7c2e
        };</script>

   3) 重新部署。两台设备打开同一网址，记一笔，另一台会实时刷新。

   注：Spark 计划免费、不会自动暂停；额度（每天数万次读写、1GiB 存储）
       对个人记账绰绰有余。安全提醒见 README：config 会出现在网页源码里。
   ============================================================ */
(function () {
  var cfg = window.LEDGER_FIREBASE;
  if (!cfg || !cfg.config || !window.firebase) return;     // 未配置 → 保持本地模式

  try {
    if (!firebase.apps.length) firebase.initializeApp(cfg.config);
  } catch (e) { return; }

  var db = firebase.firestore();
  var auth = firebase.auth ? firebase.auth() : null;
  var DEMO_EMAILS = (cfg.demoEmails || []).map(function (e) {
    return String(e || '').toLowerCase();
  });

  // Demo accounts are local-only sandboxes for visitors trying the app
  // without spending the owner's Firestore quota.
  function isDemoUser() {
    var u = auth && auth.currentUser;
    if (!u || !u.email) return false;
    return DEMO_EMAILS.indexOf(String(u.email).toLowerCase()) !== -1;
  }

  // Per-user document: /ledger/{uid}. Each authenticated user gets an
  // isolated doc keyed by their own UID, enforced by Firestore rules.
  function getRef() {
    var u = auth && auth.currentUser;
    if (!u) return null;
    if (isDemoUser()) return null;  // skip Firestore entirely for demo users
    return db.collection('ledger').doc(u.uid);
  }

  var unwrap = function (snap) {
    if (!snap.exists) return null;
    var d = snap.data().data;
    try { return typeof d === 'string' ? JSON.parse(d) : d; } catch (e) { return null; }
  };

  window.LedgerCloud = {
    enabled: true,
    isDemoUser: isDemoUser,
    load: function () {
      var ref = getRef();
      if (!ref) return Promise.resolve(null);
      return ref.get().then(unwrap).catch(function () { return null; });
    },
    save: function (state) {
      var ref = getRef();
      if (!ref) return Promise.resolve();
      return ref.set({ data: JSON.stringify(state), updated_at: Date.now() }).catch(function () {});
    },
    subscribe: function (cb) {
      var ref = getRef();
      if (!ref) return;
      ref.onSnapshot(function (snap) {
        if (snap.metadata && snap.metadata.hasPendingWrites) return;  // 忽略本机写入回声
        var s = unwrap(snap);
        if (s) cb(s);
      }, function () {});
    },
  };
})();
