# AI 辅助论坛 · 匿名问答社区

> 一个用 React + Vite + Tailwind CSS 构建的 AI 辅助匿名问答社区，参考 Discourse AI、Reddit Answers、知乎直答设计。无后端、无账号，数据存浏览器 `localStorage`，AI 能力通过瘦 serverless 代理调用外部 LLM，代理不可用时回落 mock。

## 项目概览

面向大众的 AI 辅助论坛，MVP 聚焦问答场景，AI 提供内容生成、智能问答与摘要、个性化推荐与搜索三项能力，匿名无账号，以「AI 功能使用率」为成功标准。

| 页面 | 路径 | 简介 |
| --- | --- | --- |
| 首页 | `/` | 推荐流 + AI 功能入口 |
| 问题广场 | `/explore` | 全部问题列表 |
| 问题详情 | `/detail/:id` | 问题 + 回答 + AI 摘要 / AI 帮我答 |
| 匿名提问 | `/ask` | 编辑器内联 AI 生成 |
| 搜索 | `/search?q=` | 自然语言搜索 + AI 要点 |
| 数据看板 | `/dashboard` | AI 使用率与反馈统计 |

## 技术栈

- **框架**：React 18 + React Router DOM 6
- **构建**：Vite 5（HMR + Sourcemap）
- **样式**：Tailwind CSS 3（`aif-*` 语义化配色）
- **图标**：lucide-react
- **数据持久化**：浏览器 `localStorage`（零后端）
- **AI**：瘦 serverless 代理（持 LLM key）+ 客户端 mock 兜底 + 客户端 Reverse RAG
- **语言**：JavaScript (JSX)

## 目录结构

```
.
├── index.html              # Vite 入口 HTML
├── vite.config.js          # Vite 配置（端口 5174）
├── tailwind.config.js      # Tailwind 主题（aif-* 配色）
├── postcss.config.js
├── package.json
├── public/fonts/           # InstrumentSans / GeistMono
├── src/
│   ├── main.jsx            # React 入口
│   ├── App.jsx             # 路由表
│   ├── index.css           # 全局样式 + forum-root
│   ├── bootstrap/          # 初始化（身份 + 迁移 + 种子）
│   ├── components/forum/   # Navbar / Footer
│   ├── constants/          # localStorage 键名 / 昵称素材
│   ├── contexts/           # ForumAppContext
│   ├── layouts/            # ForumLayout
│   ├── pages/forum/        # 6 个页面 + mockData
│   ├── seed/               # 种子数据
│   ├── services/           # identity / storage / migration / seed
│   └── types/              # 类型定义
├── docs/                   # 文档资产
│   ├── ia.md               # 信息架构
│   ├── arch-prd/           # 架构级 PRD（自包含 HTML）
│   └── prd/                # PRD（自包含 HTML）
├── prototype/              # 静态 HTML 原型
└── design/                 # 视觉设计稿
```

## 快速开始

### 环境要求

- Node.js ≥ 18
- npm

### 安装与运行

```bash
# 在本目录内执行
npm install

# 启动开发服务器（端口 5174，自动打开浏览器）
npm run dev
```

### 其他命令

```bash
npm run build      # 生产构建（输出到 dist/）
npm run preview    # 预览生产构建
```

## 核心特性

- **匿名问答核心**：自动生成匿名昵称（如「游客#A3F2」），无需注册
- **内联 AI 内容生成**：在编辑器内调用 AI 润色、扩写、生成草稿
- **AI 智能问答与摘要**：长话题一键摘要，答案可溯源回链（客户端 Reverse RAG）
- **AI 个性化推荐与搜索**：基于本地行为信号的匿名个性化
- **无后端架构**：客户端 Reverse RAG，从 localStorage 检索相关帖拼入 prompt

## AI 调用架构

- **主路径**：无状态 serverless 边缘函数持 LLM API key（环境变量，不进仓库 / 不进前端 bundle），转发请求并支持 SSE 流式透传。
- **兜底路径**：代理未配置 key / 错误 / 限流 / 离线时，回落确定性模板回复，标注「模拟回复（离线演示）」。
- **客户端 Reverse RAG**：从 localStorage 检索 top-N 相关帖拼入 prompt，让外部模型答案带本站来源回链。

详细需求与架构见 [`docs/arch-prd/`](docs/arch-prd/)、[`docs/prd/`](docs/prd/)、[`docs/ia.md`](docs/ia.md)。

## 配色系统

`tailwind.config.js` 中定义 `aif-*`（AI Forum）语义化配色：

- `aif-primary-*`：靛蓝主色（50–900）
- `aif-neutral-*`：中性灰（50–900）
- `aif-background` / `aif-foreground` / `aif-card` / `aif-border` / `aif-muted` 等语义色
- `aif-success` / `aif-warning` / `aif-error` 及对应 `*-bg` 半透明背景

字体：`font-aif-sans`（InstrumentSans）、`font-aif-mono`（GeistMono），通过 `public/fonts/` 本地加载。

## License

MIT
