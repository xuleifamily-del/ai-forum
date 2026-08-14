# AI 辅助匿名论坛 Phase 2-4 - 产品需求文档

## Overview
- **Summary**: 本文档定义 ai-forum 项目 Phase 2（AI 伴随层）、Phase 3（搜索与推荐）、Phase 4（看板与打磨）三个阶段的功能需求、非功能需求与验收标准。目标是在 Phase 1 核心问答闭环基础上，完成完整的 AI 行为伴随层、语义搜索与个性化推荐、数据看板与体验打磨，使产品达到作品集项目可对外展示的完成度。
- **Purpose**: 解决 Phase 1 遗留的 AI 能力不完整（缺少摘要、模糊度检测、自动初始回答）、搜索仅展示 mock 数据、推荐无个性化、看板仅展示 mock 指标、身份管理无真实交互、缺少移动端适配等问题。
- **Target Users**: 三类用户均受益——提问者获得 AI 润色提示与初始回答；浏览者获得 AI 摘要与语义搜索；回答者获得个性化推荐与草稿辅助。

## Goals
- **G1 (Phase 2)**: 完善 AI 伴随层——AI 摘要带可点击引用展示于问题详情页顶部，提问时检测模糊表述并提示润色，问题发布后自动生成 AI 初始回答，AI 服务三态降级（available/degraded/unavailable）不中断核心功能。
- **G2 (Phase 3)**: 搜索与推荐闭环——搜索页接入 AI 语义搜索（查询改写 + 要点摘要 + 引用溯源），首页推荐流基于 BehaviorProfile.tagWeights 做个性化排序，AI 使用率可在看板中真实统计。
- **G3 (Phase 4)**: 数据看板与打磨——Dashboard 页读取真实埋点数据展示 AI 使用率与反馈指标，匿名身份管理（查看/重置/清空）真实可用，Notification API 支持后台补全通知，移动端（≤640px）布局正常，关键交互有防抖与懒加载。

## Non-Goals (Out of Scope)
- 不引入独立 AI 助手对话窗（AI 入口仅内联编辑器，遵循项目约定）。
- 不实现后端账号体系与跨端数据同步（属于长期 Phase 4+，不在本次 MVP 范围）。
- 不做讨论帖（开放讨论）和知识库（结构化沉淀）内容类型——PRD 甘特图中的此条目归属于后续大版本，本次聚焦 MVP 8 周内的甘特图交付。
- 不引入 WebSocket 实时通信与推送通知服务端——Notification API 仅用于浏览器端后台补全的本地通知。
- 不做真实搜索引擎索引或服务端向量检索——语义搜索基于客户端 Reverse RAG + LLM 查询改写。

## Background & Context
- Phase 1 已完成：核心问答闭环（提问/浏览/回答/点赞）、DeepSeek API 代理接入（`server/routes/ai.js` 4 个路由）、Express 后端限流（IP 20 req/min）、客户端 AI 调用封装（`aiService.js`）、行为信号基础记录（`behaviorService.js` 含 7d/30d/30d+ 三档权重衰减）、AIInteraction 埋点（`aiInteractionService.js`）。
- 当前技术栈：React 18 + Vite + Tailwind（前端端口 5174）、Express + PostgreSQL + Redis（后端端口 5175）、DeepSeek deepseek-v4-pro 模型。
- 架构约束：数据主存 localStorage + 后端 PostgreSQL 双写；AI Key 仅存环境变量 `DEEPSEEK_API_KEY`，不进前端 bundle；AI 不可用回落 mock 模板，标注「模拟回复（离线演示）」。

## Functional Requirements

### Phase 2 - AI 伴随层
- **FR-2.1 AI 摘要展示与状态管理**：问题详情页顶部展示 AI 摘要卡片，内容为 Markdown 渲染，携带可点击 `[N]` 引用跳转到对应回答，展示状态徽章（stable/outdated/updated）与生成时间。
- **FR-2.2 摘要反馈与自动更新**：摘要下方提供「有帮助」「需要更新」「不准确」三个反馈按钮；触发「需要更新」或有新回答发布时，摘要状态变为 outdated → regenerating → updated，后台重新调用 AI 生成。
- **FR-2.3 提问模糊度检测**：提问页标题输入时检测模糊表述（如「怎么办」「一直跑」「出错了」等关键词），检测到后在编辑器下方即时提示「检测到问题描述较模糊，是否 AI 润色为更精确表述？」，用户可一键接受润色建议。
- **FR-2.4 自动 AI 初始回答**：问题发布后跳转到详情页时，自动（非用户手动点击）触发 AI 帮我答生成一条初始回答，标注「AI 生成·综合社区内容」，失败不阻断页面加载。
- **FR-2.5 客户端 Reverse RAG 引擎**：AI 摘要与初始回答、语义搜索三处调用前，客户端从 localStorage/后端检索 top-N（默认 5）语义相关回答，拼接进 LLM prompt，并要求模型在输出中以 `[N]` 标注来源；解析返回映射 `[N]` → `Answer.id` 生成 Citation 数组。
- **FR-2.6 DegradationManager 三态降级**：全局 Context 中维护 aiState（available/degraded/unavailable），不可用时所有 AI 按钮 disabled 并展示灰态提示；后台指数退避重试（30s→60s→120s），恢复后自动补全缺失摘要并触发 Notification。

### Phase 3 - 搜索与推荐
- **FR-3.1 AI 语义搜索**：搜索页表单提交后，先走 LLM 查询改写（同义词、纠错、术语标准化），再基于改写结果做客户端 Reverse RAG 检索，最后生成要点摘要（带引用）展示于搜索结果顶部。
- **FR-3.2 搜索结果 UI**：搜索结果页展示 AI 摘要区（要点列表 + 可点击引用）与相关帖子卡片列表（标题/摘要/标签/回答数/点赞/时间）；无结果时展示友好空状态并给出查询改写建议。
- **FR-3.3 个性化推荐流**：首页「为你推荐」排序逻辑接入 `getEffectiveTagWeights()`（7d/30d/30d+ 三档衰减），对问题按匹配标签加权评分 × 热度分 × 新鲜度分综合排序；无行为数据时回落到默认热度排序。
- **FR-3.4 AI 使用率统计口径完善**：AIInteraction 埋点补充 `summary`、`search` 两种类型；getStats() 返回按 feature 维度真实/mock 分别计数，可计算 AI 使用率 = 成功触发次数 / 可触发会话数。
- **FR-3.5 搜索词行为记录**：搜索 query 记入 BehaviorProfile.searchQueries（最近 50 条），供后续推荐权重与搜索历史展示。

### Phase 4 - 看板与打磨
- **FR-4.1 数据看板真实数据接入**：Dashboard 页从 `aiInteractionService.getStats()`、`behaviorService.getBehavior()`、`identityService.getIdentity()` 读取真实数据替换 mock；AI 功能使用分布图、摘要有帮助率、身份信息、提问/回答计数全部真实计算。
- **FR-4.2 匿名身份管理交互**：「重置身份（保留数据）」调用 identityService 仅刷新昵称和头像（id 保留）；「生成全新身份」重新生成 id+昵称+头像（可选是否清空行为数据，二次确认）；「清空浏览历史」「清空全部本地数据」调用 storageService 真实删除对应 localStorage 键并刷新状态。
- **FR-4.3 Notification API 后台补全**：摘要/初始回答后台补全完成时，通过 Notification API 弹出浏览器通知（需用户授权，未授权降级为页面内 toast）；点击通知跳转到对应问题详情页。
- **FR-4.4 性能优化**：问题列表懒加载（IntersectionObserver 分页）、搜索输入防抖（300ms）、AI 润色按钮防抖（防连点）、已加载数据做客户端缓存（首页推荐流 5 分钟内重复访问不重新拉取）。
- **FR-4.5 响应式适配**：移动端（≤640px）导航折叠为汉堡菜单、首页卡片改为单列、详情页回答编辑器全宽、Dashboard 指标卡 2 列布局；断点测试 375px（iPhone SE）、640px、768px、1024px 四档。

## Non-Functional Requirements
- **NFR-1 性能**：AI 润色/草稿/扩写接口端到端 P95 ≤ 3s；摘要生成 P95 ≤ 5s（含 Reverse RAG 检索）；搜索结果首屏 ≤ 2s（AI 摘要允许流式渐进展示）。
- **NFR-2 降级与容错**：AI 服务不可用（超时/503/429/断网）时，所有核心功能（提问/回答/浏览/搜索帖子列表）100% 可用；AI 按钮仅灰态不阻塞。
- **NFR-3 安全与隐私**：所有 AI 交互仅发送问题标题/正文/已有回答文本，不发送用户匿名身份 ID 到 LLM；DEEPSEEK_API_KEY 仅服务端读取，前端 bundle 中 grep 不到。
- **NFR-4 数据一致性**：localStorage 与后端双写，前端优先读 localStorage（离线可用），在线时后台同步到 PostgreSQL；冲突策略以客户端较新时间戳为准。
- **NFR-5 可访问性**：所有交互按钮带 aria-label；AI 状态变更有屏幕阅读器可读的 live region；颜色对比度符合 WCAG AA。
- **NFR-6 可追踪性**：所有 AI 产物（摘要/初始回答/搜索摘要）携带 `generatedAt`、`sourceAnswerIds`、`citations`、`mock` 四个可审计字段。

## Constraints
- **Technical**: 继续使用现有 Express 后端（不切换 FastAPI），React 18 函数组件 + Hooks，Tailwind `aif-*` 语义配色，localStorage 键名必须定义在 `forumStorageKeys.js` 并通过 `migrationService.js` 迁移。
- **Business**: MVP 为个人作品集展示项目，不引入付费依赖超出 DeepSeek 免费额度；Zeabur 部署环境变量配置不可写回代码。
- **Dependencies**: 新增库需检查现有 `package.json` 无冲突：Markdown 用已有 `react-markdown` + `remark-gfm`；图表使用已有柱状图纯 CSS 实现（如需更复杂可加 `recharts`，但优先 CSS 控制文件体积）。

## Assumptions
- 用户浏览器支持 Notification API（现代浏览器覆盖率 >95%），不支持时降级为页面内 toast。
- 用户 localStorage 可用（隐私模式下部分浏览器限制，已通过 `hasLocalStorage()` 兜底）。
- DeepSeek API OpenAI 兼容协议保持稳定，SSE 流式输出格式不变。
- 现有后端 PostgreSQL + Redis 在 Zeabur 环境正常运行；DB 不可用时 AI 路由独立可用（已在 `server/index.js` 中处理 AI 路由在 DB 503 守卫前挂载）。

## Acceptance Criteria

### AC-1: AI 摘要卡片展示与引用跳转
- **Given**: 用户打开一个已有 AI 摘要的问题详情页
- **When**: 页面加载完成
- **Then**: 顶部展示 AI 摘要卡片，包含 Markdown 渲染正文、状态徽章（stable/outdated/updated）、`[N]` 形式引用；点击 `[N]` 引用后页面滚动到对应回答并高亮 2s
- **Verification**: `programmatic`

### AC-2: 摘要反馈触发重新生成
- **Given**: 用户在问题详情页看到 stable 状态的摘要
- **When**: 点击「需要更新」按钮并填写反馈（可选）
- **Then**: 摘要状态先切换到 outdated → regenerating，完成后切换到 updated 并展示新内容，`updatedAt` 时间戳刷新
- **Verification**: `programmatic`

### AC-3: 提问页模糊表述检测与润色提示
- **Given**: 用户在提问页标题输入框中输入「useEffect 一直跑怎么办」
- **When**: 输入完成后失焦或输入停止 800ms
- **Then**: 编辑器下方出现提示条「检测到问题描述较模糊，是否 AI 润色为更精确表述？」，提供「润色」和「忽略」按钮；点击润色后标题被替换为 AI 结果并可继续编辑
- **Verification**: `human-judgment`

### AC-4: 问题发布后自动生成初始 AI 回答
- **Given**: 用户在提问页填写完标题+正文并点击「发布」
- **When**: 跳转到详情页且问题 answerCount 为 0
- **Then**: 页面自动（无需用户点击）在回答区顶部流式生成 AI 初始回答，标注「AI 生成·综合社区内容」；生成失败仅展示错误提示，不影响问题详情其他内容加载
- **Verification**: `programmatic`

### AC-5: Reverse RAG 注入与引用溯源
- **Given**: AI 生成摘要/初始回答/搜索摘要时，localStorage 或后端中存在 3+ 条相关回答
- **When**: LLM 返回内容中包含 `[1]` `[2]` 等引用标记
- **Then**: 客户端解析返回内容生成 Citation 数组，每条 `[N]` 渲染为 `<a>` 标签点击跳转到对应回答；`sourceAnswerIds` 与 citations 持久化保存
- **Verification**: `programmatic`

### AC-6: DegradationManager 三态降级与自动恢复
- **Given**: 开发环境临时移除 `DEEPSEEK_API_KEY`（或断网）
- **When**: 用户访问任意 AI 功能入口
- **Then**: 所有 AI 按钮变灰 disabled，旁显「AI 暂不可用」tooltip；Context 中 aiState = unavailable；30s/60s/120s 自动重试；恢复 Key 后下次重试成功自动切回 available
- **Verification**: `human-judgment`

### AC-7: 语义搜索返回带引用的 AI 摘要
- **Given**: 用户在搜索框输入「useEffect 跑两次」（与已有问题标题措辞不同但语义一致）
- **When**: 点击「搜索」
- **Then**: 顶部 AI 摘要包含 3-5 条要点，每条有 `[N]` 引用；相关帖子列表命中语义匹配的「useEffect 重复执行」问题；search query 记入 BehaviorProfile.searchQueries
- **Verification**: `programmatic`

### AC-8: 首页推荐流基于行为画像排序
- **Given**: 用户连续浏览 5 个带 `react` 标签的问题（每个停留 >3s），且对其中 2 条回答点赞
- **When**: 返回首页刷新「为你推荐」
- **Then**: 推荐流前 3 条中至少 2 条带 `react` 标签；清除行为数据后推荐回落为默认热度排序
- **Verification**: `human-judgment`

### AC-9: 数据看板展示真实 AI 使用率指标
- **Given**: 用户进行了 5 次 AI 润色（3 次真实 2 次 mock）、2 次 AI 回答（1 次真实 1 次 mock）、3 次摘要生成（2 次有帮助反馈）
- **When**: 打开 Dashboard 页
- **Then**: AI 功能使用分布图中 polish=5 / answer=2 / summary=3，真实与 mock 分段展示；摘要有帮助率 = 2/3 ≈ 66.7%；所有数据均非 mockData.js 的静态值
- **Verification**: `programmatic`

### AC-10: 匿名身份管理交互真实生效
- **Given**: 当前匿名身份为「游客#A3F2」，本地有 10 条浏览记录
- **When**: 点击「重置身份（保留数据）」后确认
- **Then**: 昵称与头像变化但 id 与浏览记录保留；点击「清空全部本地数据」二次确认后，刷新页面所有计数归零且重新生成新身份
- **Verification**: `programmatic`

### AC-11: Notification API 后台补全通知
- **Given**: 用户授权了浏览器通知，且此前有一个问题因 AI 服务降级未生成摘要
- **When**: AI 服务恢复后后台补全完成
- **Then**: 浏览器弹出系统通知「你的问题已获得 AI 摘要」；点击通知跳转到对应问题详情页；未授权时页面右上角展示 toast 并可点击跳转
- **Verification**: `human-judgment`

### AC-12: 移动端布局适配
- **Given**: 浏览器视口宽度 375px（iPhone SE 模拟）
- **When**: 依次访问首页、搜索、提问、详情、看板五个页面
- **Then**: 所有内容不出现水平滚动条，导航栏折叠为汉堡菜单，卡片/指标卡为单列或 2 列自适应布局，关键按钮点击区域 ≥ 44×44px
- **Verification**: `human-judgment`

### AC-13: 性能防抖与懒加载
- **Given**: 用户在搜索框快速连续输入 10 个字符
- **When**: 输入停止 300ms 后才触发一次查询改写请求（Network 面板可见）
- **Then**: 首页问题列表滚动到底部时自动加载下一页，未加载项显示骨架屏；AI 润色按钮点击后 2s 内再次点击不触发重复请求
- **Verification**: `programmatic`

## Open Questions
- [ ] Phase 4 响应式适配是否需要专门的汉堡菜单交互组件？还是直接复用现有 Navbar 堆叠布局？
- [ ] Notification API 授权弹窗前是否需要前置引导（如「开启通知，摘要补全完成后第一时间告诉你」）？
- [ ] 数据看板的 AI 使用率图表需要饼图/折线图吗？当前 mock 仅使用了 CSS 柱状图。
- [ ] 客户端 Reverse RAG 语义相似度计算：使用纯 JS token overlap（无需 embeddings）是否足够？是否需要引入轻量相似度库？
