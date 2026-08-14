# Redis 读缓存接入计划

## Summary

为 ai-forum 后端（Express + PostgreSQL）接入 Redis 作为读缓存层，缓存最昂贵的两个查询：问题详情（`getQuestionById`，3 次串行查询）与问题列表（`listQuestions`，全表排序 + COUNT）。Redis 不可用时自动降级直查 PostgreSQL，功能不受影响。

**范围限定**：仅读缓存，不含限流、浏览量缓冲、AI 锁。

## Current State Analysis

### 现状（基于探索）
- [server/db/pool.js](file:///d:/ai-forum/server/db/pool.js)：从 `process.env.DATABASE_URL` 创建 `pg.Pool`，无 URL 时 `isDbAvailable=false`，仅 warn 不崩溃。
- [server/repositories/questionRepository.js](file:///d:/ai-forum/server/repositories/questionRepository.js)：
  - `getQuestionById(id)`（行 53-99）：串行 3 次查询（question / answers / summary），每次详情页打开都跑，无缓存。
  - `listQuestions({sort,limit,offset,tag})`（行 25-51）：`COUNT(*)` + `SELECT ... ORDER BY` 两次查询，`hot` 排序与 `tag` 过滤均无索引。
- [server/index.js](file:///d:/ai-forum/server/index.js)：`GET /api/health` 返回 `{ status, db }`，无 redis 状态。
- [package.json](file:///d:/ai-forum/package.json)：依赖 `express ^4.21.2`、`pg ^8.13.1`，无任何 redis 包。
- [.gitignore](file:///d:/ai-forum/.gitignore)：已忽略 `.env*`，凭证不会进仓库。
- [zbpack.json](file:///d:/ai-forum/zbpack.json)：Zeabur 会自动注入同服务下 Redis 组件的 `REDIS_URL`，无需改此文件。

### 安全约束（复刻 DATABASE_URL 模式）
- Redis 连接串**仅**从 `process.env.REDIS_URL` 读取，绝不硬编码。
- 用户提供的连接串（含密码 `wJz5P127sf9km0WrN83hEnMA6c4GLvOB`）只能配在 Zeabur 环境变量，不进任何文件。
- 浏览器代码（`src/`）不引入 redis。

## Proposed Changes

### 1. 新增依赖
**文件**：[package.json](file:///d:/ai-forum/package.json)
- 在 `dependencies` 新增 `"ioredis": "^5.4.6"`（ESM 友好、支持 Cluster/Sentinel、社区主流）。
- 不新增脚本（无需 redis 专用命令）。
- 执行 `npm install` 安装。

### 2. 新建 Redis 客户端
**文件**：`server/db/redis.js`（新建，镜像 pool.js 的降级模式）
- `import Redis from 'ioredis'`
- `const redisUrl = process.env.REDIS_URL`
- 有 URL：`const redisClient = new Redis(redisUrl, { maxRetriesPerRequest: 1, enableReadyCheck: true, lazyConnect: false })`
  - 监听 `error` 事件打 warn（避免未捕获异常）
  - 监听 `connect` 打日志
- 无 URL：`redisClient = null`，`isRedisAvailable = false`，warn 提示
- 导出：`redisClient`、`isRedisAvailable`（boolean）
- **关键**：`isRedisAvailable` 仅在 connect 成功后置 true；连接断开时置 false（监听 `end`/`reconnecting` 事件动态更新）。

### 3. 新建缓存服务
**文件**：`server/services/cacheService.js`（新建）
- 导入 `redisClient`、`isRedisAvailable` from `../db/redis.js`
- 封装四个方法，**全部 try/catch，失败静默返回 miss**（降级到 PG）：
  - `async get(key)` → 返回反序列化对象或 `null`
  - `async set(key, value, ttlSeconds)` → `SET key value EX ttlSeconds`
  - `async del(key)` → 删除单个 key
  - `async delByPattern(pattern)` → 用 `SCAN`（非 `KEYS`，避免阻塞）遍历删除匹配 key
- 若 `!isRedisAvailable`，所有方法直接返回 null / 无操作，不抛错。

### 4. 缓存键设计
| Key 格式 | 内容 | TTL | 失效时机 |
|---|---|---|---|
| `aiforum:q:{id}` | 问题详情（含 answers + aiSummary 聚合对象） | 300s（5分钟） | createAnswer / upsertSummary 时 `DEL` |
| `aiforum:qlist:{sort}:{tag or 'all'}:{limit}:{offset}` | 问题列表 `{items, total}` | 60s（1分钟） | createQuestion 时 `delByPattern('aiforum:qlist:*')` |

- 前缀 `aiforum:` 避免与其他服务冲突。
- TTL 短（列表 60s、详情 300s），平衡缓存命中率与数据新鲜度。
- view_count 变化不主动失效详情缓存（浏览数允许短时不一致，5分钟 TTL 内可接受）。

### 5. 仓储层集成缓存
**文件**：[server/repositories/questionRepository.js](file:///d:/ai-forum/server/repositories/questionRepository.js)（修改）

**`getQuestionById(id)`**：
- 开头：`const cached = await cacheService.get(`aiforum:q:${id}`); if (cached) return cached;`
- 末尾（返回前）：`await cacheService.set(`aiforum:q:${id}`, result, 300);`
- 缓存 miss 时走原 3 次查询逻辑，结果写回缓存。
- **注意**：null 结果（问题不存在）也缓存（短 TTL 30s），防缓存穿透。

**`listQuestions({sort,limit,offset,tag})`**：
- key = `aiforum:qlist:${sort}:${tag||'all'}:${limit}:${offset}`
- 开头查缓存，命中直接返回；miss 走原查询后写回（TTL 60s）。

**`createQuestion(data)`**：
- 末尾：`await cacheService.delByPattern('aiforum:qlist:*');`
- 不影响 `q:{id}`（新 id 无旧缓存）。

**文件**：[server/repositories/answerRepository.js](file:///d:/ai-forum/server/repositories/answerRepository.js)（修改）
**`createAnswer(data)`**：
- 末尾：`await cacheService.del(`aiforum:q:${data.questionId}`);`
- 同步失效该问题详情缓存（answers 列表变了）。

**文件**：[server/repositories/summaryRepository.js](file:///d:/ai-forum/server/repositories/summaryRepository.js)（修改）
**`upsertSummary(data)`**：
- 末尾：`await cacheService.del(`aiforum:q:${data.questionId}`);`
- 摘要变化时失效详情缓存。

### 6. 健康检查增强
**文件**：[server/index.js](file:///d:/ai-forum/server/index.js)（修改）
- `GET /api/health` 返回 `{ status, db: isDbAvailable, redis: isRedisAvailable }`
- status 逻辑：`db && redis` → `'ok'`；`db && !redis` → `'degraded'`（仍可用，只是无缓存）；`!db` → `'degraded'`（API 503）。
- **不**因 Redis 不可用而返回 503 —— Redis 是可选加速层，不是必需。

### 7. 前端健康状态展示（可选小改）
**文件**：[src/bootstrap/forumBootstrap.js](file:///d:/ai-forum/src/bootstrap/forumBootstrap.js)（修改）
- `checkHealth()` 返回值新增 `redis` 字段，存入 `dbAvailable` 旁的 `redisAvailable`。
**文件**：[src/contexts/ForumAppContext.jsx](file:///d:/ai-forum/src/contexts/ForumAppContext.jsx)（修改）
- 暴露 `redisAvailable` 状态（Dashboard 可选展示，本轮不强制改 Dashboard）。

## Assumptions & Decisions

1. **库选择**：`ioredis` 而非 `redis`（node-redis）。ioredis API 更稳定、Promise 原生、ESM 友好。
2. **降级策略**：Redis 不可用时，所有缓存调用静默 miss，请求直达 PG。**不**返回错误，**不**影响功能。
3. **不缓存 null**：除 `getQuestionById` 返回 null 时缓存 30s 防穿透外，其他 miss 不缓存空值。
4. **不引入限流**：用户明确仅要读缓存。限流是独立任务（可后续用 express-rate-limit + connect-redis）。
5. **不缓冲浏览量**：`incrementView` 仍直接写 PG。缓冲需后台 flush 逻辑，复杂度高，超出范围。
6. **SCAN 而非 KEYS**：`delByPattern` 用 SCAN 迭代，避免阻塞 Redis（生产安全）。
7. **Zeabur 自动注入 REDIS_URL**：无需改 zbpack.json，用户只需在 Zeabur 控制台确认 Redis 组件已绑定到 ai-forum 服务。
8. **不创建测试文件**：遵循用户「不主动创建文档/测试」约定。验证通过手动 curl + 日志。

## Verification Steps

### 本地验证（无 REDIS_URL，降级模式）
1. `npm install` 成功安装 ioredis
2. `npm run build` 成功
3. `npm start` 启动后：
   - `GET /api/health` 返回 `{ status:"degraded", db:false, redis:false }`（无 PG 也无 Redis）
   - 控制台日志包含 `[redis] REDIS_URL is not set. Caching disabled.`
4. 代码库搜索 `wJz5P127sf9km0WrN83hEnMA6c4GLvOB` / `129.226.93.124:31636` 确认零硬编码

### 部署验证（Zeabur 配置 REDIS_URL 后）
1. Zeabur 控制台确认 `REDIS_URL` 已注入（格式 `redis://:password@host:port`）
2. 部署后 `GET /api/health` 返回 `{ status:"ok", db:true, redis:true }`
3. `GET /api/questions/:id` 两次：
   - 第一次：PG 查询（日志可见 3 次 SELECT），写入 `aiforum:q:{id}`
   - 第二次：缓存命中（无 PG 查询日志，响应更快）
4. `POST /api/questions/:id/answers` 后再 `GET /api/questions/:id`：应重新查 PG（缓存已失效）
5. 停掉 Redis（或改错 REDIS_URL）后 `GET /api/questions/:id` 仍正常返回（降级直查 PG）

## 不在范围内（明确排除）
- ❌ API 限流（express-rate-limit）
- ❌ 浏览量 Redis 缓冲（INCR + 批量回写）
- ❌ AI 摘要生成分布式锁
- ❌ 客户端 localStorage 缓存调整
- ❌ Dashboard 缓存命中率展示
- ❌ 索引优化（questions.created_at / view_count / tags GIN）—— 这是 PG 层独立优化
