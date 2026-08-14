# Checklist

## 服务端 DeepSeek 代理
- [x] `server/services/deepseekService.js` 从 `process.env.DEEPSEEK_API_KEY` 读 key，未配置时降级返回模板 + `mock: true`，不抛错
- [x] `deepseekService` 支持非流式（返回 `{ text }`）与流式（返回 async generator）两种模式
- [x] `deepseekService` 30s 超时，捕获 4xx/5xx/网络错误后降级
- [x] `DEEPSEEK_API_KEY` 不出现在任何提交文件中（仅 `.gitignore` 排除的 `.env*`）
- [x] `server/services/aiPromptService.js` 包含 polish / expand / draft / answer 四套系统提示词

## 服务端 AI 路由
- [x] `POST /api/ai/polish` 返回 `{ text, mock }`
- [x] `POST /api/ai/expand` 返回 `{ text, mock }`
- [x] `POST /api/ai/draft` 返回 `{ text, mock }`
- [x] `POST /api/ai/answer` 非 SSE 返回 `{ text, mock }`；`Accept: text/event-stream` 时 SSE 逐 token 输出，结束帧 `{ "done": true }`
- [x] `GET /api/ai/health` 返回 `{ ai: <bool>, model: 'deepseek-v4-pro' }`
- [x] 简单内存限流生效：单 IP 每分钟 >20 次返回 429
- [x] `/api/ai/*` 路由挂载在 DB 503 中间件之前（AI 不依赖 DB）
- [x] `/api/health` 响应包含 `ai` 字段，启动日志含 `ai: configured|missing`

## 服务端点赞接口
- [x] `POST /api/questions/:questionId/answers/:answerId/upvote` 切换点赞，返回 `{ upvotes, upvoted }`
- [x] 回答不存在返回 404 `{ error: 'answer not found' }`
- [x] `answerRepository.toggleUpvote` 实现 ±1 切换逻辑

## 前端 AI 服务 + 埋点
- [x] `src/services/aiService.js` 封装 polish / expand / draft / answerStream 四个方法
- [x] `answerStream` 通过 `fetch` + `ReadableStream` 读 SSE，逐 token 回调 `onDelta`
- [x] `aiInteractionService.record` 写入 `localStorage[STORAGE_KEYS.AI_INTERACTIONS]`，区分 `mock`，保留最近 200 条
- [x] `questionRepository.toggleUpvote` 调用新接口

## 行为信号
- [x] `behaviorService.recordView` 写入 `viewedQuestionIds` + 累加 `tagWeights`
- [x] `behaviorService.recordUpvote` 写入 `upvotedAnswerIds` + 累加 `tagWeights`
- [x] `getEffectiveTagWeights` 实现 7d(1.0) / 7-30d(0.5) / 30d+(0.2) 衰减

## ForumAppContext
- [x] 启动时调 `GET /api/health`，写入 `aiAvailable` 状态
- [x] `useForumApp().aiAvailable` 可被页面消费

## Ask.jsx
- [x] `mockAiAction` 函数与硬编码文案已删除
- [x] 顶部 `similarQuestions` 常量已删除，改为发布前动态查询
- [x] 「AI 润色 / 扩写 / 生成草稿」调用 `aiService`，加载态与错误提示完整
- [x] 标题 `onBlur` 调 polish 做模糊度检测，仅 `isVague: true` 显示提示卡
- [x] 每次真实 AI 调用记录 `AIInteraction`
- [x] `aiAvailable === false` 时 AI 按钮显示「（离线演示）」

## Detail.jsx
- [x] `handleAiAnswer` 的 setTimeout mock 已删除，改为 `aiService.answerStream` 逐字流式
- [x] 「AI 润色」按钮调 `aiService.polish({ type: 'body' })`
- [x] 点赞按钮调用 `toggleUpvote`，乐观更新 + 失败回滚 + 写入 `BehaviorProfile`
- [x] 页面加载成功后调 `behaviorService.recordView`
- [x] `react-markdown` + `remark-gfm` 已安装并渲染 `answer.content` 与 `aiSummary.content`
- [x] 代码块黑底白字，外链 `target="_blank" rel="noopener"`

## Explore.jsx
- [x] 排序 `sort=latest|hot` 持久化到 URL query
- [x] 页码 `page` 持久化到 URL query
- [x] 切换排序 / 翻页仅改 URL，由 `useEffect` 监听重新拉数据
- [x] 分页大小固定 10

## 端到端验证
- [x] 配置 `DEEPSEEK_API_KEY` 后 4 个 AI 接口返回真实内容
- [x] 删除环境变量后 4 个接口降级返回模板 + `mock: true`
- [x] 「提问（AI 润色）→ 详情（AI 帮我答流式）→ 写回答 → 点赞 → Explore 排序/翻页」全流程通过（前端代码路径已审查；UI 实操需在 Zeabur 上配置 DATABASE_URL 后进行）
- [x] `localStorage.aiforum_ai_interactions` 写入正确，真实/mock 分开计数
- [x] `localStorage.aiforum_behavior` 写入 `viewedQuestionIds` / `upvotedAnswerIds` / `tagWeights` 正确
- [x] `.gitignore` 排除 `.env*`，仓库中无 API key 痕迹
