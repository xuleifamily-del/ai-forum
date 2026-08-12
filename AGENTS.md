# AGENTS.md（项目级 · ai-forum）

本文件记录**本项目特定**的结构、约定与规则。通用工程约定见全局 `~/.trae-cn/AGENTS.md`，此处不再重复。

## 项目概述

`ai-forum` 是一个 AI 辅助匿名问答社区，参考 Discourse AI、Reddit Answers、知乎直答设计。无后端、无账号，数据存浏览器 `localStorage`，AI 能力通过瘦 serverless 代理调用外部 LLM，代理不可用时回落 mock。

详细需求与架构见 `docs/prd/`、`docs/arch-prd/`、`docs/ia.md`；交互原型见 `prototype/`；视觉设计稿见 `design/`。

## 目录结构

```
ai-forum/
├── index.html              # Vite 入口 HTML
├── vite.config.js          # Vite 配置（端口 5174，无 API 代理）
├── tailwind.config.js      # Tailwind 主题（aif-* 配色 + aif 字体）
├── postcss.config.js
├── package.json            # 名称 ai-forum
├── public/
│   └── fonts/              # InstrumentSans / GeistMono（forum 专用）
├── src/
│   ├── main.jsx            # React 入口，挂载 BrowserRouter
│   ├── App.jsx             # 路由表（forum 路由挂在根路径）
│   ├── index.css           # 全局样式 + Tailwind 指令 + forum-root 样式
│   ├── bootstrap/
│   │   └── forumBootstrap.js   # 初始化入口（身份 + 迁移 + 种子）
│   ├── components/
│   │   └── forum/
│   │       ├── Navbar.jsx
│   │       └── Footer.jsx
│   ├── constants/
│   │   ├── forumStorageKeys.js # localStorage 键名 + Schema 版本
│   │   └── forumNickname.js    # 匿名昵称生成素材
│   ├── contexts/
│   │   └── ForumAppContext.jsx # 全局 Context（identity / behaviorProfile / aiAvailable）
│   ├── layouts/
│   │   └── ForumLayout.jsx     # 论坛布局壳（Navbar + Outlet + Footer）
│   ├── pages/
│   │   └── forum/
│   │       ├── Home.jsx        # 首页（推荐流）
│   │       ├── Explore.jsx     # 问题广场
│   │       ├── Detail.jsx      # 问题详情
│   │       ├── Ask.jsx         # 匿名提问
│   │       ├── Search.jsx      # 搜索
│   │       ├── Dashboard.jsx   # 数据看板
│   │       └── mockData.js     # 页面 mock 数据
│   ├── seed/
│   │   └── forumSeedData.js    # 种子问题/回答/摘要
│   ├── services/
│   │   ├── identityService.js  # 匿名身份生成与持久化
│   │   ├── storageService.js   # localStorage 读写封装
│   │   ├── migrationService.js # Schema 版本迁移
│   │   └── seedService.js      # 种子数据注入
│   └── types/
│       └── forum.js            # 类型定义（产品语义）
├── docs/                   # 文档资产
│   ├── ia.md               # 信息架构
│   ├── arch-prd/           # 架构级 PRD（自包含 HTML）
│   └── prd/                # PRD（自包含 HTML）
├── prototype/              # 静态 HTML 原型
└── design/                 # 视觉设计稿
```

## 路由结构

论坛路由挂在**根路径**（独立应用，无 `/forum` 前缀）：

| 路径             | 组件        | 说明                          |
| ---------------- | ----------- | ----------------------------- |
| `/`              | `Home`      | 首页（推荐流）                |
| `/explore`       | `Explore`   | 问题广场                      |
| `/detail/:id`    | `Detail`    | 问题详情                      |
| `/ask`           | `Ask`       | 匿名提问                      |
| `/search`        | `Search`    | 搜索（带 `?q=` 参数）         |
| `/dashboard`     | `Dashboard` | 数据看板                      |

所有路由共享 `ForumAppProvider`（提供全局 Context）与 `ForumLayout`（Navbar + Footer 壳）。

## 项目特定约定

### 1. 无后端架构

- 所有数据存浏览器 `localStorage`，键名统一定义在 `src/constants/forumStorageKeys.js`，禁止散落硬编码。
- 匿名身份首次访问自动生成（昵称形如「游客#A3F2」），持久化关联所有帖/答/行为信号。

### 2. AI 调用架构：瘦 serverless 代理 + 客户端 mock 兜底

- **主路径**：无状态边缘函数持 LLM API key（环境变量，不进仓库/不进前端 bundle），转发请求并支持 SSE 流式透传，处理 CORS 与基础限流。
- **兜底路径**：代理未配置 key / 返回错误 / 限流 / 网络失败 / 离线时，回落确定性模板回复，标注「模拟回复（离线演示）」。
- **LLM key 严禁**内嵌浏览器直连（安全 + CORS 阻断）、严禁访客自填 key（体验差 + XSS 风险）。
- **客户端 Reverse RAG**：无向量库无服务端检索下，客户端从 localStorage 检索 top-N 相关帖拼入 prompt，让外部模型答案带本站来源回链。

### 3. AI 入口仅内联编辑器

- 不设独立 AI 助手对话窗。
- 摘要 / 问答 / 推荐 / 搜索就近嵌入各自场景（话题页 / 搜索框 / 首页流）。

### 4. 配色系统（Tailwind 主题）

`tailwind.config.js` 中定义 `aif-*`（AI Forum）语义化配色，请优先使用：

- `aif-primary-*`：靛蓝主色（50–900）
- `aif-neutral-*`：中性灰（50–900）
- `aif-background` / `aif-foreground` / `aif-card` / `aif-border` / `aif-muted` 等语义色
- `aif-success` / `aif-warning` / `aif-error` 及对应 `*-bg` 半透明背景

字体：`font-aif-sans`（InstrumentSans）、`font-aif-mono`（GeistMono），通过 `public/fonts/` 本地加载。

### 5. 行为信号与个性化

- 行为信号（浏览 / 停留 / 点击 / 搜索词）仅存本地不上传。
- 基于本地行为信号做会话内 + 本地累计排序，实现匿名个性化推荐。

### 6. 指标口径

- AI 使用率 = AI 功能实际触发次数 / AI 可触发会话数，全部客户端统计。
- 真实 AI（代理路径）与 mock 兜底分别计数，看板分开展示，避免 mock 污染核心指标。

## 任务执行建议

- 修改路由时，同步检查页面内 `to="/..."`、`useNavigate('/...')`、`location.pathname` 判断是否一致。
- 新增 localStorage 键时，必须加到 `forumStorageKeys.js` 并在 `migrationService.js` 中处理版本迁移。
- 启动开发：在本目录执行 `npm install` → `npm run dev`（端口 5174）。
- 文档与原型改动归入 `docs/` / `prototype/` / `design/`，不混入 `src/`。
