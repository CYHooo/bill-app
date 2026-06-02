# 记账 · 个人现金流

给自己用的记账网页：**雾岩灰**配色（含日/夜切换）、韩元 ₩、手机电脑都好用。
每日记账 + 现金流总览打通，可托管到 GitHub Pages，并接免费数据库做多设备实时同步。

```
index.html         ← 入口（GitHub Pages 默认找它）
app/
  cloud.js         多设备实时同步（Firebase Firestore，按登录用户 UID 分库）
  auth.js          登录（Firebase Auth）
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

## 体验账号（只读本地，不影响线上数据）

想直接试用，可以用下面这个测试账号登录：

| 账号 | 密码 |
|------|------|
| `test@bill-app.demo` | `demotest` |

测试账号登录后**完全在内存中运行**：不写 Firestore、也不写 localStorage，所以不会消耗任何额度，也不会被其他用户看到。左下角徽标会显示 **「本地演示」**。

- 每次刷新页面都会自动生成一份**当月随机演示账目**（8–15 笔交易，分类/金额/备注/日期都随机），现金流参数也会跟着变
- 可以随意添加、修改、删除，**但仅在当前会话中保留**
- 刷新 / 关闭标签 / 重新登录 → 又是全新的一组随机数据

---

## 第一步：托管到 GitHub Pages

1. 在 GitHub 新建一个仓库，例如 `bill-app`（Public）。
2. 把 `index.html` 和整个 `app/` 文件夹传上去（网页上 **Add file → Upload files** 拖拽即可；
   或用 git push）。
3. 仓库 **Settings → Pages → Build and deployment**：
   - Source 选 **Deploy from a branch**
   - Branch 选 **main** / 目录 **/(root)** → Save
4. 等 1～2 分钟，页面给出网址：
   `https://你的用户名.github.io/bill-app/`
   手机、电脑打开都能用。未接数据库时，数据先存在各自浏览器本地（刷新不丢）。

> 想多设备同步「手机记、电脑实时看」，做下面第二步。

---

## 第二步：接 Firebase Firestore（多设备实时同步）

**Firebase Firestore**（Google）免费、自带实时推送、不会自动暂停，能直接被静态网页调用。

1. 去 https://console.firebase.google.com 用 Google 账号 **新建项目**（免费 Spark 计划）。
2. 左侧 **Build → Firestore Database → 创建数据库**（地区就近选，模式随意，下一步会改规则）。
3. **项目设置（⚙️）→ 常规 → 你的应用**，点 **Web（</>）** 注册一个应用，
   复制给出的 `firebaseConfig`（apiKey / projectId / appId 等几项）。
4. 编辑 `index.html`，在 `<head>` 里、`<script src="app/cloud.js">` 那行 **之前**，加上：
   ```html
   <script src="https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/12.14.0/firebase-auth-compat.js"></script>
   <script>
     window.LEDGER_FIREBASE = {
       config: {
         apiKey: '…', authDomain: '…', projectId: '…',
         storageBucket: '…', messagingSenderId: '…', appId: '…'
       },
       // 这些邮箱登录后只在本地存储，不写 Firestore（避免占用免费额度）
       demoEmails: ['test@bill-app.demo']
     };
   </script>
   ```
   > 用的是 v12.14.0 的 **compat** SDK（保留旧的 `firebase.*` 全局 API）；如果以后想升到新版，URL 里的 `12.14.0` 改成想要的版本号即可。
5. 重新上传 `index.html` 到 GitHub。

**容量与长期免费**：Spark 计划永久免费、**不会自动暂停**；每天数万次读写、1GiB 存储，
个人记账常年用不满。

---

## 第三步：开启登录（强制要做）

GitHub Pages 是公开网页，`firebaseConfig` 会出现在源码里。**不开登录的话，任何人拿到你的网址、配上数据库公开规则，理论上就能读到你的账目。**

### 3.1 启用 Email/Password + 关闭自助注册（邀请制）

1. Firebase 控制台 → **Authentication → Get started**
2. **Sign-in method** 标签 → 打开 **Email/Password** → Save
3. **Settings** 标签 → **User actions** 区域 → **关闭** Enable create (sign-up)
   > 这一步关键。关了之后只有你能在控制台手动 Add user，外人无法自助注册。

### 3.2 创建你自己的账号

Authentication → **Users → Add user** → 填邮箱+密码 → 复制那一行的 **User UID**（28 位字符）。

### 3.3 创建测试账号（可选）

再添加一个：邮箱 `test@bill-app.demo`，密码 `test`。这个账号会被前端识别为「演示模式」，所有写操作只走本地 localStorage，不进行云端同步。

> 测试账号的邮箱必须与 `index.html` 里 `demoEmails` 数组中的值一致；想换名字两边一起改。

### 3.4 锁 Firestore 规则（按 UID 分库 + 屏蔽测试账号写入）

Firestore → **Rules**，替换为下面这段并 **Publish**：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ledger/{uid} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid
                         && request.auth.token.email != 'test@bill-app.demo';
    }
  }
}
```

规则要点：
- `match /ledger/{uid}` —— 每个用户的数据存在以 **自己 UID** 命名的文档里
- `request.auth.uid == uid` —— 只能读写以自己 UID 命名的那一份，互相看不到
- `request.auth.token.email != 'test@bill-app.demo'` —— 测试账号即使绕过前端也写不进 Firestore（双重防线）

### 3.5 部署后验证

- 打开网址 → 应该先弹**登录框**
- 用你自己的账号登录 → 左下角徽标 **「已云同步 · 多设备」**
- 退出，再用 `test@bill-app.demo / test` 登录 → 徽标 **「本地演示 · 不占额度」**

---

## 添加新用户（邀请制）

想给朋友/家人加一个独立账号：

1. Firebase 控制台 → **Authentication → Users → Add user** → 填他的邮箱+密码
2. 把网址、邮箱、密码发给他
3. 对方登录后会在 `/ledger/{他的UID}` 自动建一份属于他的账本

不用改任何代码、不用改 `firebaseConfig`。每个用户的数据天然隔离。

---

## 数据说明

### 现金流默认值

新打开一个月（没手动配过）时，固定项有内置基础值：

| 项目 | 默认值 |
|------|--------|
| 房租 | ₩500,000 |
| 管理费 | ₩100,000 |
| 话费 + 网费 | ₩88,000 |
| 月底发薪 | ₩4,400,000 |

点数字可改某个月，改完那个月就用新值，其他月仍然走默认（互不影响）。想全局调整就修改 `app/data.jsx` 里的 `blankCashflow()`。

### 现金流口径

- **本月新增消费**
  - 固定消费 = 房租 + 管理费 + 话费/网费
  - 其他花销 = 交通 + 日常花销（来自每日记账）
- **现金流出** = 新增消费 + 信用卡还款
- **可动用结余** = 可用现金 − 现金流出，结转下月
- **下月可用现金** = 本月结余 + 本月底发薪（自动结转，可手动覆盖）

---

## 设计备注
- 配色：**雾岩灰** / **雾岩灰·夜**，顶栏 ☀/☾ 一键切换，选择记在浏览器、加载前即应用。
- 字体：标题与大额数字 Noto Serif SC，界面 Noto Sans SC；韩元千位分隔无小数。
- 布局：宽屏首页为整宽概览横幅 + 主栏/侧栏仪表盘；窄屏单列 + 底部 Tab。
