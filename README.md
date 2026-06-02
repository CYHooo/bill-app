# 记账 · 个人现金流

给自己用的记账网页：**雾岩灰**配色（含日/夜切换）、韩元 ₩、手机电脑都好用。
每日记账 + 现金流总览打通，可托管到 GitHub Pages，并接免费数据库做多设备实时同步。

```
index.html         ← 入口（GitHub Pages 默认找它）
app/
  cloud.js         可选：多设备实时同步（Firebase Firestore）
  auth.js          可选：登录（Firebase Auth）
  data.jsx         数据层：分类 / 韩元 / 持久化 / 现金流计算
  ui.jsx           组件：弹层 / 环形图 / 录入键盘
  login.jsx        登录界面
  screens_main.jsx 首页 + 记账
  screens_plan.jsx 现金流 + 统计
  theme.jsx        日/夜配色切换
  app.jsx          外壳：鉴权门 / 导航 / 月份切换 / 挂载
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

## ⚠️ 关于隐私 —— 开启登录（推荐）

GitHub Pages 是公开网页，`firebaseConfig` 会出现在源码里。**不开登录的话，任何人拿到你的网址、配上数据库公开规则，理论上就能读到你的账目。**

App 已内置一个登录界面（仅在你按下面配置后才会出现）。开启「只有我能进」三步：

1. **建你的账号**：Firebase 控制台 → **Authentication → Get started** → 开启
   **Email/Password** 登录方式 → **Users → Add user**，填你自己的邮箱 + 密码。
   建好后在该用户那一行复制 **User UID**（一串字符）。
2. **锁数据库规则**：Firestore → **Rules**，改成只认你的 UID（把第二步的开放规则替换掉）：
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /ledger/{doc} {
         allow read, write: if request.auth != null
                            && request.auth.uid == '粘贴你的 UID';
       }
     }
   }
   ```
3. **引入 Auth SDK**：在 `index.html` 里，`firebase-firestore-compat.js` 那行之后，再加一行：
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
   ```

重新部署后，打开网址会先要求**登录**；只有你的账号能进、能读写，别人即使打开页面也是空的登录框、读不到任何数据。登录状态会一直保持，右上角有「退出」按钮。

> 不接数据库（纯本地模式）时不会出现登录框 —— 那种情况下数据只在你自己浏览器里，
> 别人访问网址也只会看到他们自己的空白本地数据，本来就互相看不到。

---

## 设计备注
- 配色：**雾岩灰** / **雾岩灰·夜**，顶栏 ☀/☾ 一键切换，选择记在浏览器、加载前即应用。
- 字体：标题与大额数字 Noto Serif SC，界面 Noto Sans SC；韩元千位分隔无小数。
- 布局：宽屏首页为整宽概览横幅 + 主栏/侧栏仪表盘；窄屏单列 + 底部 Tab。
- 现金流口径：① 新增消费 = 固定支出 + 每日记账汇总；② 现金流出 = ① + 信用卡还款；
  可动用结余 = 可用现金 − ②，结转下月。
