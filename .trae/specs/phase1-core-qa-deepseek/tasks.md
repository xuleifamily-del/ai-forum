# Tasks

- [ ] Task 1: 服务端 DeepSeek 代理基础（service + health）
  - [ ] SubTask 1.1: 新增 `server/services/deepseekService.js`：从 `process.env.DEEPSEEK_API_KEY` 读 key；封装 `chat({ messages, model, stream, signal })`，非流式返回 `{ text }`，流式返回 async generator；未配置 key 或调用失败时降级返回模板文案 + `{ mock: true }`；30s 超时；不打印 key
  - [ ] SubTask 1.2: 新增 `server/services/aiPromptService.js`：4 套系统提示词模板（polish / expand / draft / answer），要求 JSON 或纯文本输出格式
  - [ ] SubTask 1.3: 修改 `server/index.js` 的 `/api/health`：响应新增 `ai: !!process.env.DEEPSEEK_API_KEY` 字段；启动日志打印 `ai: configured|missing`
  - [ ] SubTask 1.4: 确认 `.gitignore` 排除 `.env*`（若未排除则追加）

- [ ] Task 2: 服务端 AI 路由（4 个接口 + health）
  - [ ] SubTask 2.1: 新增 `server/routes/ai.js`，挂载以下路由：
    - `POST /polish` — 入参 `{ type: 'title'|'body', text, context? }`，调 `deepseekService` 返回 `{ text, mock }`
    - `POST /expand` — 入参 `{ title, body }`，返回 `{ text, mock }`
    - `POST /draft` — 入参 `{ intent: 'question'|'answer', title, body? }`，返回 `{ text, mock }`
    - `POST /answer` — 入参 `{ questionId, title, body, topAnswers? }`；若 `Accept: text/event-stream` 则 SSE 流式输出（每帧 `{ "delta": "..." }`，结束帧 `{ "done": true }`），否则非流式返回 `{ text, mock }`
    - `GET /health` — 返回 `{ ai: <bool>, model: 'deepseek-v4-pro' }`
  - [ ] SubTask 2.2: 实现简单内存限流：每 IP 每分钟 20 次，超限返回 429
  - [ ] SubTask 2.3: 在 `server/index.js` 挂载 `app.use('/api/ai', aiRouter)`（放在 DB 503 中间件之前，AI 不依赖 DB）

- [x] Task 3: 服务端回答点赞接口
  - [ ] SubTask 3.1: 在 `server/routes/answers.js` 新增 `POST /:questionId/answers/:answerId/upvote`，切换 `upvotes ±1`，返回 `{ upvotes, upvoted: <bool> }`；回答不存在返回 404
  - [ ] SubTask 3.2: 在 `server/repositories/answerRepository.js` 新增 `toggleUpvote(questionId, answerId)` 方法

- [x] Task 4: 前端 AI 服务层 + 埋点
  - [ ] SubTask 4.1: 新增 `src/services/aiService.js`：封装 `polish / expand / draft / answerStream(onDelta)`；统一处理 `mock` 标记与错误；`answerStream` 用 `fetch` + `ReadableStream` 读 SSE
  - [ ] SubTask 4.2: 新增 `src/services/aiInteractionService.js`：`record({ type, success, mock, duration })` 写入 `localStorage[STORAGE_KEYS.AI_INTERACTIONS]`，保留最近 200 条
  - [ ] SubTask 4.3: 在 `src/services/questionRepository.js` 新增 `toggleUpvote(questionId, answerId)` 调用新接口

- [x] Task 5: 行为信号采集服务
  - [ ] SubTask 5.1: 新增 `src/services/behaviorService.js`：`recordView(questionId, tags)` / `recordUpvote(answerId, tags)` 写入 `localStorage[STORAGE_KEYS.BEHAVIOR]`，结构 `{ viewedQuestionIds: [], upvotedAnswerIds: [], tagWeights: { tag: { weight, lastUpdate } }, updatedAt }`
  - [ ] SubTask 5.2: 实现 `getEffectiveTagWeights()`：读取后按 7d(1.0) / 7-30d(0.5) / 30d+(0.2) 衰减

- [x] Task 6: ForumAppContext 接入 aiAvailable
  - [ ] SubTask 6.1: 在 `src/contexts/ForumAppContext.jsx` 启动时调 `GET /api/health`，新增 `aiAvailable` 状态（true/false）
  - [ ] SubTask 6.2: 提供 `useForumApp().aiAvailable` 给页面消费

- [x] Task 7: Ask.jsx 替换 mock
  - [ ] SubTask 7.1: 删除 `mockAiAction` 函数与硬编码文案、顶部 `similarQuestions` 常量
  - [ ] SubTask 7.2: 「AI 润色 / 扩写 / 生成草稿」改为调 `aiService`，加载态、错误提示、结果回填；记录 `AIInteraction`
  - [ ] SubTask 7.3: 标题 `onBlur` 调 `aiService.polish({ type: 'title' })` 做模糊度检测，仅当返回 `isVague: true` 才显示润色提示卡（提示词要求返回 JSON `{ isVague, suggestion }`）
  - [ ] SubTask 7.4: 发布前 `GET /api/questions?keyword=<title>` 取 top-3 渲染为相似问题卡片（无标题时空态）
  - [ ] SubTask 7.5: 接入 `aiAvailable`：AI 按钮在离线时显示「（离线演示）」提示

- [x] Task 8: Detail.jsx 替换 mock + 补功能
  - [ ] SubTask 8.1: 删除 `handleAiAnswer` 的 setTimeout mock；改为 `aiService.answerStream({ questionId, title, body }, onDelta)` 逐字流式写入编辑器
  - [ ] SubTask 8.2: 「AI 润色」按钮接 `aiService.polish({ type: 'body', text: answer })`
  - [ ] SubTask 8.3: 点赞按钮接 `questionRepository.toggleUpvote`：乐观更新 + 失败回滚 + 调 `behaviorService.recordUpvote`
  - [ ] SubTask 8.4: 加载成功后调 `behaviorService.recordView(question.id, question.tags)`
  - [ ] SubTask 8.5: 引入 `react-markdown` + `remark-gfm`，渲染 `answer.content` 与 `aiSummary.content`；代码块黑底白字；外链 `target="_blank" rel="noopener"`
  - [ ] SubTask 8.6: 安装依赖：`npm i react-markdown remark-gfm`

- [x] Task 9: Explore.jsx 排序与分页持久化
  - [ ] SubTask 9.1: 用 `useSearchParams` 读写 `sort` 与 `page`，切换时仅改 URL
  - [ ] SubTask 9.2: `useEffect` 监听 URL 变化重新拉数据，分页大小固定 10

- [x] Task 10: 端到端验证
  - [ ] SubTask 10.1: 设置本地 `DEEPSEEK_API_KEY` 环境变量后启动 `npm run dev`，验证 4 个 AI 接口均返回真实内容
  - [ ] SubTask 10.2: 删除环境变量重启，验证 4 个接口均降级返回模板文案 + `mock: true`
  - [ ] SubTask 10.3: 完整走通「提问（AI 润色）→ 详情页（AI 帮我答流式）→ 写回答（Markdown）→ 点赞 → Explore 排序/翻页」全流程
  - [ ] SubTask 10.4: 检查 `localStorage` 中 `aiforum_ai_interactions` 与 `aiforum_behavior` 写入正确

# Task Dependencies
- Task 2 依赖 Task 1（service 与 prompt 必须先就绪）
- Task 4 依赖 Task 2 + Task 3（前端封装需对应后端接口）
- Task 7、Task 8 依赖 Task 4 + Task 5 + Task 6（aiService / behaviorService / aiAvailable）
- Task 9 独立，可与 Task 7/8 并行
- Task 10 依赖全部前序任务完成
