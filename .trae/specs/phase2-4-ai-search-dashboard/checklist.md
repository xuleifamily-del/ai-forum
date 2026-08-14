# AI 辅助匿名论坛 Phase 2-4 - 验证检查清单

## Phase 2: AI 伴随层

- [x] Checkpoint 2.1: `reverseRagService.retrieveTopAnswers()` 对给定问题正确返回按相似度排序的 top-N 回答，结果包含 id、content、snippet 字段
- [x] Checkpoint 2.2: `reverseRagService.parseCitations()` 正确解析 LLM 返回中的 `[N]` 引用，生成 index→answerId 映射的 Citation 数组
- [x] Checkpoint 2.3: `POST /api/ai/summary` 路由存在并返回 `{ content, citations, mock }`；无 DEEPSEEK_API_KEY 时回落 mock=true 模板
- [x] Checkpoint 2.4: `summaryRepository` upsertSummary/getSummary/recordFeedback 三接口正确流转 status（stable→outdated→regenerating→updated）
- [x] Checkpoint 2.5: 问题详情页顶部 AI 摘要卡片渲染成功，含 Markdown 正文、状态徽章、生成时间
- [x] Checkpoint 2.6: 摘要中 `[N]` 引用为可点击链接，点击后滚动到对应回答卡片并有黄色高亮闪烁 ≥2s
- [x] Checkpoint 2.7: 摘要卡片三个反馈按钮（有帮助/需要更新/不准确）点击后调用 feedback 接口，计数持久化；「需要更新」触发重新生成流程
- [x] Checkpoint 2.8: `degradationService` 三态状态机（available/degraded/unavailable）正确切换；指数退避重试间隔 30s→60s→120s 符合要求
- [x] Checkpoint 2.9: `ForumAppContext` 暴露 `aiState` 字段；所有 AI 功能按钮使用 AiGate 组件在 unavailable 时灰态 disabled + tooltip「AI 暂不可用」
- [x] Checkpoint 2.10: 提问页标题输入模糊表述（如「怎么办」「一直跑」）触发 detectVagueness 返回 isVague=true，800ms debounce 后下方出现润色提示条
- [x] Checkpoint 2.11: 点击提示条「AI 润色」按钮触发一次 polish-title 调用，标题内容被替换为 AI 返回结果并保留用户编辑能力
- [x] Checkpoint 2.12: 新发布问题（answerCount=0）跳转详情页后 1s 内自动触发 AI 初始回答流式生成；失败不阻断其他内容
- [x] Checkpoint 2.13: AI 初始回答持久化为 isAI=true 的回答，作者显示「AI 助手」；第二次刷新页面不再重复自动触发

## Phase 3: 搜索与推荐

- [x] Checkpoint 3.1: `POST /api/ai/search-rewrite` 路由存在，对「useEffect 跑两次」返回 rewritten 含标准化术语「重复执行」「StrictMode」
- [x] Checkpoint 3.2: 搜索页提交请求链路为：用户 query → search-rewrite → reverseRag 检索 topQuestions → buildSearchSummary prompt → AI 生成要点摘要
- [x] Checkpoint 3.3: 搜索结果页 AI 摘要区渲染 3-5 条要点列表，每条要点末尾带可点击的 `[N]` 引用跳转到对应问题详情
- [x] Checkpoint 3.4: 搜索无结果时展示空状态卡片，包含改写建议或友好提示，不出现空白页
- [x] Checkpoint 3.5: 每次搜索 query 被记录到 BehaviorProfile.searchQueries（最近 50 条），localStorage 对应键持久化
- [x] Checkpoint 3.6: `scoreQuestionForUser()` 评分公式三部分（tagMatch 0.5 + hot 0.3 + freshness 0.2）权重正确，无 NaN/Infinity
- [x] Checkpoint 3.7: 用户浏览 5 个 React 问题 + 点赞 2 次后，首页「为你推荐」React 标签问题排位提升；清除行为数据后回落默认热度排序
- [x] Checkpoint 3.8: `aiInteractionService` 新增 `summary`、`search` 两种 type；getStats() 返回六维（六功能）真实/mock 计数分别不为 undefined

## Phase 4: 看板与打磨

- [x] Checkpoint 4.1: Dashboard 4 个 MetricCard（AI 使用次数、真实 AI、模拟、AI 使用率）数值来自 getStats() 实时计算，不等于 mockData 静态值
- [x] Checkpoint 4.2: FeatureChart 展示六功能（polish/expand/draft/answer/summary/search）柱状图，柱子高度随埋点真实数据变化
- [x] Checkpoint 4.3: 摘要有帮助率来自 AI_FEEDBACK 真实反馈数据，数值正确（helpful / totalFeedback）
- [x] Checkpoint 4.4: 匿名身份管理卡片信息（id、昵称、创建时间、提问数、回答数）从 identityService + localStorage 真实数据读取
- [x] Checkpoint 4.5: 「重置身份（保留数据）」按钮点击确认后，identity.id 不变，昵称/头像变化；原有 QUESTIONS/ANSWERS 数据保留
- [x] Checkpoint 4.6: 「生成全新身份」按钮重新生成 id+昵称+头像；二次确认对话框文案明确且不可跳过
- [x] Checkpoint 4.7: 「清空浏览历史」真实删除 localStorage 对应数据；「清空全部本地数据」需两次 confirm，完成后 navigate('/') 且 forumBootstrap 重新初始化
- [x] Checkpoint 4.8: `notificationService.requestPermission()` 在用户首次点击 AI 生成按钮时触发（避免无交互拦截）
- [x] Checkpoint 4.9: AI 服务恢复后，待补全队列中的摘要/初始回答自动补全完成时，granted 状态触发系统 Notification，未授权触发页面 toast
- [x] Checkpoint 4.10: 点击系统通知或 toast 正确跳转到对应问题详情页（`/detail/:id`）
- [x] Checkpoint 4.11: 搜索框输入使用 useDebounce 300ms，快速输入不触发多次 search-rewrite 请求（可通过 Network 面板或 spy 验证）
- [x] Checkpoint 4.12: AI 功能按钮点击 loading 期间为 disabled 状态，500ms 内连点不触发重复请求
- [x] Checkpoint 4.13: 首页推荐流结果写入 sessionStorage 带 TTL 5 分钟；5 分钟内刷新不重复拉取后端
- [x] Checkpoint 4.14: Explore 页问题列表 IntersectionObserver 懒加载分页，接近底部自动加载下一页并显示骨架屏
- [x] Checkpoint 4.15: 四档断点（375px iPhone SE、640px、768px、1024px）下 5 个主要页面均无水平滚动条（静态布局验证，响应式类与 overflow-x:hidden 生效）
- [x] Checkpoint 4.16: ≤640px Navbar 出现汉堡菜单按钮，点击可展开/收起导航链接，点击链接后菜单自动收起（静态代码链路验证）
- [x] Checkpoint 4.17: ≤640px 首页卡片 1 列、Dashboard 指标卡 2 列、Detail 回答编辑器全宽，所有按钮触摸区 ≥44×44px（静态代码链路验证）
- [x] Checkpoint 4.18: 新增 localStorage 键全部登记在 `forumStorageKeys.js`，并在 `migrationService.js` 中对应 Schema 版本有默认值初始化或迁移逻辑

## 端到端与构建

- [x] Checkpoint E2E-1: 全链路走查「访客身份 → 模糊提问 → 润色提示 → 发布 → 自动 AI 回答 → 人工回答 → AI 摘要 → 反馈 → 搜索 → 看板统计 → 清空数据」无阻断（静态代码链路验证）
- [x] Checkpoint E2E-2: AI 降级场景模拟（临时移除 DEEPSEEK_API_KEY 或断网）：核心提问/回答/浏览正常，AI 按钮灰态；恢复后 120s 内自动补全并通知（静态代码链路验证）
- [x] Checkpoint E2E-3: `npm run build` 退出码 0，构建日志无错误和严重警告
- [x] Checkpoint E2E-4: 生产构建产物 `npm run preview` 启动后，6 个路由（/、/explore、/detail/:id、/ask、/search、/dashboard）均可访问，HTTP 200
- [x] Checkpoint E2E-5: 控制台无 React key 警告、useEffect 依赖数组警告、未捕获 Promise rejection；grep 源码无散落 `localStorage.` 直接调用（storageService 内部除外）
- [x] Checkpoint E2E-6: 代码仓库 grep `DEEPSEEK_API_KEY|sk-` 仅出现在 `.env.example`、环境变量读取逻辑，不出现任何真实 Key 字符串硬编码
