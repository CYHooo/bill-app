# 记账 · 个人现金流

给自己用的记账网页：**雾岩灰**配色（含日/夜切换）、韩元 ₩、手机电脑都好用。
每日记账 + 现金流总览打通，可托管到 GitHub Pages，并接免费数据库做多设备实时同步。

```
index.html         ← 入口（GitHub Pages 默认找它）
app/
  cloud.js         可选：多设备实时同步（Firebase Firestore）
  data.jsx         数据层：分类 / 韩元 / 持久化 / 现金流计算
  ui.jsx           组件：弹层 / 环形图 / 录入键盘
  screens_main.jsx 首页 + 记账
  screens_plan.jsx 现金流 + 统计
  theme.jsx        日/夜配色切换
  app.jsx          外壳：导航 / 月份切换 / 挂载
```
> 部署只需要 `index.html` 和 `app/` 这两样。`uploads/`、`screenshots/` 不用上传。

---

## 第一步：托管到 GitHub Pages

1. 在 GitHub 新建一个仓库，例如 `ledger`（Public）。
2. 把 `index.html` 和整个 `app/` 文件夹传上去（网页上 **Add file → Upload files** 拖拽即可；
   或用 git push）。
3. 仓库 **Settings → Pages → Build and deployment**：
   - Source 选 **Deploy from a branch**
   - Branch 选 **main** / 目录 **/(root)** → Save
4. 等 1～2 分钟，页面给出网址：
   `https://你的用户名.github.io/ledger/`
   手机、电脑打开都能用。数据先存在各自浏览器本地（刷新不丢）。

> 想多设备同步「手机记、电脑实时看」，做下面第二步。

---

## 第二步：接免费数据库（Firebase Firestore）

**Firebase Firestore**（Google）免费、自带实时推送、不会自动暂停，能直接被静态网页调用。

1. 去 https://console.firebase.google.com 用 Google 账号 **新建项目**（免费 Spark 计划）。
2. 左侧 **Build → Firestore Database → 创建数据库**（地区就近选，模式随意，下一步会改规则）。
3. 进入 **规则（Rules）** 标签，替换为下面这段并发布（个人开放版）：
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /ledger/{doc} { allow read, write: if true; }
     }
   }
   ```
4. **项目设置（⚙️）→ 常规 → 你的应用**，点 **Web（</>）** 注册一个应用，
   复制给出的 `firebaseConfig`（apiKey / projectId / appId 等几项）。
5. 编辑 `index.html`，在 `<head>` 里、`<script src="app/cloud.js">` 那行 **之前**，加上：
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
   <script>
     window.LEDGER_FIREBASE = {
       config: {
         apiKey: '…', authDomain: '…', projectId: '…',
         storageBucket: '…', messagingSenderId: '…', appId: '…'
       },
       row: '换成一串只有你知道的随机字符串'   // 例如 myledger-9f3a7c2e
     };
   </script>
   ```
6. 重新上传 `index.html` 到 GitHub。两台设备打开同一网址，记一笔，另一台会实时刷新；
   左下角徽标会从「本地保存」变成「已云同步 · 多设备」。

**容量与长期免费**：Spark 计划永久免费、**不会自动暂停**；每天数万次读写、1GiB 存储，
个人记账常年用不满。

---

## ⚠️ 关于隐私（重要）

GitHub Pages 是公开网页，上面第二步的 `firebaseConfig` 会出现在网页源码里。也就是说：
**任何人只要拿到你的网址，理论上就能读到你的记账数据。**

- 如果只是自己用、网址不外传，账目也不太敏感 —— 上面的做法够用（把 `row` 设成
  别人猜不到的随机串能再挡一层）。
- 如果想 **真正私密**，正确做法是开 Firebase 的 **登录（Auth）**，用你自己的一个
  账号，Firestore 规则改成只允许「登录后的你」读写。代价是要在网页上加一个一次性登录框
  （登录后会一直保持，不用每次输）。

> 想要私密版的话告诉我，我给你加一个极简的登录/解锁界面，并把规则换成按账号隔离的安全规则。

---

## 设计备注
- 配色：**雾岩灰** / **雾岩灰·夜**，顶栏 ☀/☾ 一键切换，选择记在浏览器、加载前即应用。
- 字体：标题与大额数字 Noto Serif SC，界面 Noto Sans SC；韩元千位分隔无小数。
- 布局：宽屏首页为整宽概览横幅 + 主栏/侧栏仪表盘；窄屏单列 + 底部 Tab。
- 现金流口径：① 新增消费 = 固定支出 + 每日记账汇总；② 现金流出 = ① + 信用卡还款；
  可动用结余 = 可用现金 − ②，结转下月。
