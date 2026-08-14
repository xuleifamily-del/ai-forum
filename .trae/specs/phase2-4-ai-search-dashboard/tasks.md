# AI 辅助匿名论坛 Phase 2-4 - 实施计划（分解与优先级排序任务列表）

## [x] Task 1: 客户端 Reverse RAG 检索引擎
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 在 `src/services/` 下新增 `reverseRagService.js`，封装客户端语义相似度检索（基于 token 重叠 + 标签匹配 + BM25 简化版）
  - 导出 `retrieveTopAnswers({ questionId?, title, body, tags, n = 5 })` 从 questionRepository 拉取所有候选回答，计算相似度分，返回 top-N 回答内容 + answerId + snippet
  - 导出 `retrieveTopQuestions({ query, tags, n = 8 })` 用于搜索场景
  - 导出 `parseCitations(text, sourceAnswerIds)` 解析 LLM 返回的 `[N]` 标记生成 Citation 数组，索引到 answerId 的映射关系
  - 在 `forumStorageKeys.js` 中补充必要常量（无需新键名，复用现有 QUESTIONS/ANSWERS）
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-1.1: `retrieveTopAnswers` 输入含 react 关键词的问题，本地 5 条候选中返回 top-3 的 answerId 与 react 标签回答优先顺序可预测
  - `programmatic` TR-1.2: `parseCitations` 输入文本 `"...原因有二 [1]，其次是依赖数组 [2]..."` + sourceAnswerIds=['a1','a2'] 生成 citations[{index:1,answerId:'a1'},{index:2,answerId:'a2'}]
  - `human-judgement` TR-1.3: 代码中未使用任何向量化 API 或外部 embedding 服务，相似度计算纯 JS 离线可跑
- **Notes**: 保持纯本地计算，不依赖网络；无需 embeddings 模型，控制 bundle 体积

## [x] Task 2: AI 摘要服务端路由 + 生成 Prompt + 状态机
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - 扩展 `server/services/aiPromptService.js`，新增 `buildSummaryMessages({ title, body, topAnswers })` prompt 构建：要求输出分要点摘要并严格使用 `[N]` 引用
  - 扩展 `server/routes/ai.js` 新增 `POST /api/ai/summary` 路由（走限流 + 降级 mock），返回 `{ content, citations, mock }`
  - 扩展 `server/routes/summaries.js` 增加 `GET /api/questions/:questionId/summary` 读取与 `POST /api/ai/summary/feedback` 反馈接口
  - 扩展 `server/repositories/summaryRepository.js` 实现 upsert + status 状态流转（stable→outdated→regenerating→updated）
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: `POST /api/ai/summary` 带有效 DEEPSEEK_API_KEY 返回 content 为非空字符串且 citations 为数组；无 Key 时返回 mock=true 的模板内容
  - `programmatic` TR-2.2: 对已有 summary 的 questionId 调用 feedback(type='needsUpdate')，summary 记录 status 从 stable → outdated → regenerating → updated 状态流转正确
  - `human-judgement` TR-2.3: Summary prompt 明确要求「只使用提供的回答内容做摘要，禁止臆造未提供的信息」以对抗幻觉
- **Notes**: 服务端 summaryRepository 操作 PostgreSQL，需兼容 isDbAvailable=false 时的降级

## [/] Task 3: 问题详情页 - AI 摘要卡片 UI + 引用跳转 + 反馈
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - 在 `Detail.jsx` 加载问题后同时拉取 summary，在问题正文上方渲染摘要卡片（带 Sparkles 图标、状态徽章、生成时间）
  - 使用 ReactMarkdown 渲染摘要正文，自定义 Citation `[N]` 链接组件：点击后 `scrollIntoView` 到对应回答，`element.animate` 黄色高亮闪烁 2s
  - 摘要卡片底部三个反馈按钮（👍 有帮助 / 🔄 需要更新 / ❌ 不准确），点击后调用 feedback 接口并计数
  - 接收到 feedback "needsUpdate" 时调用 AI 重新生成，状态徽章显示 regenerating 骨架，完成后替换内容
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `programmatic` TR-3.1: 详情页加载一个有 summary 的问题，DOM 中存在摘要卡片元素，包含状态徽章、3 个反馈按钮
  - `programmatic` TR-3.2: 摘要中的引用链接 `[1]` 元素 onClick 后，对应 id 的回答卡片 `scrollIntoView` 被调用（可 spy）
  - `human-judgement` TR-3.3: 摘要卡片视觉与问题卡片风格一致，aif-primary 左边界 + 渐变图标底色匹配 Search 页 mock 样式
- **Notes**: 新增的 answerId → DOM id 映射使用 `id="answer-${a.id}"` 以便滚动定位

## [x] Task 4: DegradationManager 三态降级 + Context 集成
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 在 `src/services/` 新增 `degradationService.js`：维护 aiState 状态机（available/degraded/unavailable），暴露 `checkAiAvailable()`、`subscribe(listener)`、`reportFailure()`、`reportSuccess()`
  - 指数退避重试：首次失败后 30s poll，连续失败翻倍至 120s 上限；成功一次后重置间隔
  - 在 `ForumAppContext.jsx` 中消费 degradationService，新增 `aiState`、`aiUnavailableReason` 字段与 `setAiUnavailable(reason)` 方法
  - 所有 AI 功能按钮（Ask 润色/扩写/草稿、Detail 帮我答/润色、Search 搜索）包裹 `AiGate` 组件：aiState=unavailable 时 disabled + tooltip="AI 暂不可用" + 灰态样式
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-4.1: 连续调用 `reportFailure()` 3 次，下一次 poll 间隔依次为 30s、60s、120s；`reportSuccess()` 后间隔重置为 30s
  - `human-judgement` TR-4.2: 拔网线或临时清除 DEEPSEEK_API_KEY 重启后端，Ask.jsx 三个 AI 按钮 2s 内变灰 disabled，悬浮显示「AI 暂不可用」
  - `human-judgement` TR-4.3: 恢复网络/Key 后等待不超过 120s，按钮自动恢复可用；整个过程核心输入框不受影响
- **Notes**: 避免每 120s 真正发网络请求打 DeepSeek API——使用轻量 `GET /api/health` 的 `ai` 字段探活

## [/] Task 5: 提问页 - 模糊度检测 + 润色提示条
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - 在 `src/services/aiService.js` 新增 `detectVagueness(text)` 纯函数：匹配中文模糊关键词白名单（怎么办、一直跑、出错了、用不了、报错、不对、搞不定、求解答…共 20+ 条）+ 关键词密度 + 文本长度启发式，返回 `{ isVague: bool, reason: string, suggestion: string }`
  - 在 `Ask.jsx` 标题输入框加 800ms debounce 失焦/停止输入后调用；触发 isVague=true 时在标题下方展示内联提示条（含「AI 润色」按钮）
  - 点击提示条的「AI 润色」走已有 polish type='title' 接口并填入结果，同时 acceptPolish=true 记录埋点
  - 提示条带「忽略」按钮或点 X 关闭，本次会话不再对同一文本重复提示
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-5.1: `detectVagueness('useEffect 一直跑怎么办')` 返回 `{ isVague: true }`；`detectVagueness('React useEffect 依赖数组完整但 StrictMode 下重复执行如何排查')` 返回 `{ isVague: false }`
  - `human-judgement` TR-5.2: 在提问页完整输入模糊标题并停顿，提示条出现位置在标题框正下方且不遮挡正文框，视觉与 aif-warning 色调，5s 可自然消失或手动关闭
  - `programmatic` TR-5.3: 点击提示条「AI 润色」触发一次 polish-title 调用且 aiInteraction record type=polish, subType=vaguenessHint 新增计数
- **Notes**: vaguenessHint 埋点如需新增类型请扩展 aiInteractionService 常量

## [x] Task 6: 问题发布后自动 AI 初始回答
- **Priority**: high
- **Depends On**: Task 1, Task 4
- **Description**:
  - 在 `Detail.jsx` 中新增自动触发逻辑：`loadQuestion` 完成后，若 `question.answerCount === 0 && !question.aiInitialAnswerTriggered` 则自动调用 handleAiAnswer（复用现有流式逻辑）
  - 自动调用失败不阻断页面任何其他渲染，仅在回答区顶部显示「AI 初始回答生成失败，稍后可点击重试」
  - 初始回答完成后自动持久化为一条 isAI=true 的回答（走 createAnswer），避免下次进入重触发
  - 在回答列表中区分 AI 回答与人工回答：AI 回答卡片左侧带 4px aif-primary 边框 + 作者名「AI 助手」
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-6.1: 使用新用户身份发布一个无回答问题，跳转详情页 1s 内触发一次 `/api/ai/answer` 网络请求（Network 可见或 spy）
  - `human-judgement` TR-6.2: AI 初始回答卡片样式明显不同于人工回答，带「AI 生成·综合社区内容」徽章，作者头像是机器人图标
  - `programmatic` TR-6.3: 刷新同一详情页第二次，不再重复触发自动 AI 回答（isAI 回答已存在）
- **Notes**: 自动触发使用 AbortController 与用户手动点击共享逻辑，避免重复冲突

## [x] Task 7: 语义搜索 - 查询改写 + Reverse RAG + 要点摘要
- **Priority**: high
- **Depends On**: Task 1, Task 4
- **Description**:
  - 扩展 `server/routes/ai.js` 新增 `POST /api/ai/search-rewrite`：把用户 query 改写成标准术语（同义词纠错、中英文统一），返回 `{ rewritten, keywords }`
  - 扩展 `server/services/aiPromptService.js` 新增 `buildSearchSummaryMessages({ query, rewritten, topQuestions })`：生成 3-5 条要点摘要，每条要求带引用
  - 扩展 `Search.jsx`：提交搜索时先请求改写，再用改写后的 query + keywords 调 reverseRagService.retrieveTopQuestions，将 topQuestions 发给 AI 生成要点摘要，流式渲染到 AI 摘要区
  - 搜索 query 调用 `behaviorService.recordSearch(query)`（需要在 behaviorService 中新增 searchQueries 数组与对应 STORAGE_KEYS 迁移项）
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-7.1: POST `/api/ai/search-rewrite` 输入「useEffect 跑两次」返回 rewritten 包含 "重复执行"、"StrictMode" 等标准化词
  - `programmatic` TR-7.2: Search.jsx 搜索一个已有种子问题相关 query，相关帖子列表非空，AI 摘要区要点数组长度 ≥ 3
  - `human-judgement` TR-7.3: 搜索「xyz 不存在的关键词」返回 0 条结果时，空状态卡片给出「试试更通用的关键词」或 LLM 生成的改写建议，不出现空白页
- **Notes**: 流式渲染复用现有 `answerStream` 的 SSE 处理逻辑封装到通用的 `streamText()`

## [x] Task 8: 个性化推荐流 - tagWeights 加权排序
- **Priority**: medium
- **Depends On**: Task 1
- **Description**:
  - 在 `src/services/questionRepository.js` 或新增 `recommendService.js` 中实现 `scoreQuestionForUser(q, effectiveTagWeights)`：
    - tagMatchScore = Σ(effectiveTagWeights[t] for t in q.tags)，归一化 0-1
    - hotScore = log(q.viewCount+1) * 0.4 + log(q.answerCount*2+1) * 0.6，归一化
    - freshnessScore = exp(-(now - q.createdAt) / (7*24*3600*1000))
    - finalScore = 0.5 * tagMatchScore + 0.3 * hotScore + 0.2 * freshnessScore
  - `Home.jsx` 拉取所有候选（或 top-30 热度）后，在客户端排序并展示 top-6
  - 当 effectiveTagWeights 为空（新用户）时跳过 tagMatchScore，走纯热度排序 fallback
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `programmatic` TR-8.1: 在 effectiveTagWeights = { react: 5.0, vue: 0.2 } 下，10 条混合候选中 tag=react 的问题 finalScore 普遍高于 vue 问题
  - `human-judgement` TR-8.2: 手动浏览 5 个 React 问题并点赞，回到首页后「为你推荐」区域 React 卡片明显排在前面（可通过浏览器 localStorage 查看 tagWeights 验证）
  - `programmatic` TR-8.3: 无浏览历史（localStorage BEHAVIOR 空）首次访问，推荐流排序与原 hot 排序一致
- **Notes**: 推荐计算在客户端，避免额外后端请求；计算耗时需控制在 5ms 内（<100 条候选时）

## [/] Task 9: AIInteraction 埋点扩展 + 看板真实数据接入
- **Priority**: high
- **Depends On**: Task 2, Task 7
- **Description**:
  - 扩展 `aiInteractionService.js` TYPES 加入 `summary`、`search` 两种类型；新增 `recordFeedback({ questionId, summaryId, type, helpful })` 持久化到 STORAGE_KEYS.AI_FEEDBACK
  - 新增 `getUsageRate()` 计算 AI 使用率 = 成功触发次数 / 可触发会话数（会话定义：30 分钟内活跃算一个会话；可触发 = 进入 Detail 或 Ask 或 Search 页一次）
  - `Dashboard.jsx`：
    - MetricCard 4 个指标（AI 使用次数、真实 AI 次数、模拟次数、AI 使用率）从 getStats 计算
    - FeatureChart 横轴按 polish/expand/draft/answer/summary/search 六维真实展示
    - 反馈率从 getFeedbackStats() 计算，不再用 mockData
    - 身份信息从 identityService.getIdentity() 真实读取，postsCount/answersCount 从 localStorage 统计
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `programmatic` TR-9.1: 新增 STORAGE_KEYS.AI_FEEDBACK 键并通过 migrationService 初始化；记录 5 条 feedback 后 getFeedbackStats().helpfulRate 计算正确
  - `programmatic` TR-9.2: Dashboard.jsx 打开后 4 个 MetricCard 数值中至少有 1 个不等于 mockData 中的静态值（已有埋点时）
  - `human-judgement` TR-9.3: FeatureChart 柱状图柱子宽度与高度随真实数据变化，无数据时柱子高度为最小 8% 但标签仍可见
- **Notes**: 匿名身份 postsCount/answersCount 遍历 QUESTIONS/ANSWERS 即可，O(n) 可接受

## [/] Task 10: 匿名身份管理真实交互 + 数据操作
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - 扩展 `identityService.js`：新增 `resetIdentityKeepData()`（保留 id，刷新昵称+头像）、`generateNewIdentity(clearBehavior=false)`（全新 id+昵称+头像，可选清行为）
  - `Dashboard.jsx` 三个按钮接入真实逻辑：
    - 「重置身份（保留数据）」→ confirm → resetIdentityKeepData → 刷新展示
    - 「生成全新身份」→ confirm("新身份将丢失你的历史关联计数，确定？") → generateNewIdentity(clearBehavior=false)
    - 「清空浏览历史」→ confirm → StorageService.remove(STORAGE_KEYS.BEHAVIOR.viewedQuestionIds 子集或整键按 AGENTS 约定) → 提示已清空
    - 「清空全部本地数据」→ 二次确认（连续两次 confirm，第二次文案「此操作不可撤销，真的确定？」）→ StorageService.clear 全部论坛键 → navigate('/')
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `programmatic` TR-10.1: resetIdentityKeepData 后 identity.id 与之前相同，nickname 变化；localStorage QUESTIONS/ANSWERS 数据仍在
  - `programmatic` TR-10.2: 清空全部本地数据后刷新页面，forumBootstrap 重新初始化身份且所有计数归零
  - `human-judgement` TR-10.3: 清空数据按钮 hover 时 aif-error 色描边加粗，二次确认弹窗文字清晰且不可点外层跳过
- **Notes**: 注意 identity 与 authorId 的关系——已有内容 authorId 不变，只是当前身份切换为新 id 后不再算在新身份计数中

## [x] Task 11: Notification API 后台补全通知
- **Priority**: medium
- **Depends On**: Task 4, Task 2
- **Description**:
  - 新增 `src/services/notificationService.js`：
    - `requestPermission()` 弹授权（在用户首次点击「AI 初始回答生成」按钮时顺带触发，避免无交互弹窗被拦截）
    - `notifySummaryReady({ questionId, title })`：权限 granted 时调用 `new Notification()` 带 onclick 跳 `/detail/${id}`；否则 dispatch 自定义事件
    - 页面内 toast 组件 `NotificationToast` 监听自定义事件，在 Navbar 右上渲染 3.5s，点击跳同
  - `degradationService` 在 AI 服务恢复 available 后，遍历「待补全队列」（新增 localStorage 键）逐一补摘要/初始回答，每成功一个触发 notifySummaryReady
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `human-judgement` TR-11.1: 授权通知后，在 AI 恢复后 10s 内浏览器系统通知弹出，点击跳转到正确问题详情页
  - `human-judgement` TR-11.2: 未授权时，页面右上角出现 toast 卡片（aif-primary 渐变背景），点击跳转，3.5s 自动淡出
  - `programmatic` TR-11.3: 待补全队列 STORAGE_KEYS.PENDING_AI_TASKS 持久化，刷新页面不丢；全部完成后队列清空
- **Notes**: 注意 Notification API 仅在 https 或 localhost 下可用，Zeabur https 部署无问题

## [/] Task 12: 性能优化 - 防抖、懒加载、客户端缓存
- **Priority**: medium
- **Depends On**: Task 7, Task 8
- **Description**:
  - 抽取通用 `useDebounce(value, delay=300)` Hook 到 `src/hooks/`（目录不存在则新建）
  - 搜索框输入应用 useDebounce 300ms，只有最终值触发查询改写请求
  - AI 润色/扩写/草稿按钮点击后 loading 期间 disabled，防止连点；500ms 内重复点击合并
  - 首页推荐流：结果存入 `sessionStorage`（TTL 5 分钟），5 分钟内重复访问直接取缓存
  - Explore 页问题列表接入 IntersectionObserver 懒加载下一页：底部 100px 触发加载更多，加载中骨架屏
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `programmatic` TR-12.1: 在 1 秒内往搜索框打字 10 个字符，Network 面板中 `/api/ai/search-rewrite` 请求只发生 1 次（debounce 后）
  - `human-judgement` TR-12.2: Explore 页滚动，底部卡片进入视口前触发下一页请求；加载期间每张新卡片显示灰色骨架屏（脉冲动画）
  - `programmatic` TR-12.3: 5 分钟内刷新首页两次，`fetchQuestions` 实际只调用 1 次（缓存命中），sessionStorage 中写入 aif-cache-home-recommend 键
- **Notes**: Explore 懒加载的分页接口后端已有，前端只需从 questionRepository 的 fetchQuestions 扩展 page 参数

## [/] Task 13: 响应式适配 - 移动端四档布局
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - `components/forum/Navbar.jsx`：≤640px 时导航链接隐藏到汉堡菜单（点击展开侧抽屉或下拉），保留 logo / 搜索框 / 提问按钮
  - `Home.jsx` ≤640px：推荐流 1 列、AI 亮点 1 列；Hero 标题字号降为 text-2xl
  - `Dashboard.jsx` ≤640px：MetricCard 2 列（sm:grid-cols-2），图表与反馈区块堆叠
  - `Detail.jsx` ≤640px：问题详情左右结构堆叠，回答编辑器按钮变全宽
  - `Ask.jsx` ≤640px：左右两栏堆叠，提示条全宽显示
  - 断点在 375px（iPhone SE）、640px、768px、1024px 四档 DevTools 验证无水平滚动
- **Acceptance Criteria Addressed**: AC-12
- **Test Requirements**:
  - `human-judgement` TR-13.1: 375px 宽度依次访问 5 个页面，document.body.scrollWidth === window.innerWidth（无横向滚动）
  - `human-judgement` TR-13.2: ≤640px Navbar 汉堡菜单按钮点击可展开/收起，菜单中链接点击后自动收起
  - `human-judgement` TR-13.3: 所有可点击按钮（提问、发布、AI 功能等）触摸区域 ≥ 44×44px（可用 DevTools 盒模型检查）
- **Notes**: Tailwind 已有 sm: md: lg: 前缀，只需补齐缺失的响应式类；汉堡菜单可使用现有 lucide-react 的 Menu/X 图标

## [x] Task 14: 端到端走查与遗留缺陷修复
- **Priority**: high
- **Depends On**: Task 3, Task 5, Task 6, Task 7, Task 8, Task 9, Task 10, Task 11, Task 12, Task 13
- **Description**:
  - 全链路人工走查：访客 → 注册匿名身份 → 浏览首页推荐流 → 模糊提问 → 接受润色提示 → 发布 → 自动 AI 回答 → 人工回答 → AI 摘要生成 → 点反馈 → 搜索语义匹配问题 → 看板查看统计 → 重置身份 → 清空数据
  - 记录发现的 UI/交互 bug 并修复；修复 console 中 React 警告（key 缺失、useEffect 依赖数组警告等）
  - 检查 localStorage 新增键是否都在 forumStorageKeys.js 与 migrationService.js 登记，无散落硬编码
  - 最终运行 `npm run build` 生产构建 0 error，`npm run preview` 启动后 6 个路由页面可访问
- **Acceptance Criteria Addressed**: AC-1 到 AC-13 全量
- **Test Requirements**:
  - `programmatic` TR-14.1: `npm run build` 退出码 0，无 ESLint/Tailwind/Vite 错误日志
  - `human-judgement` TR-14.2: 人工走查全链路无阻断性 bug，AI 三态降级场景模拟（拔网线 / 删 Key / 恢复）完整跑通
  - `programmatic` TR-14.3: grep 代码仓库 `localStorage\.` 直接调用，全部命中 storageService 封装层（除 storageService 内部外）
- **Notes**: 本任务是最后一道质量关，不可跳过；预计修 bug 数量 5-15 条
