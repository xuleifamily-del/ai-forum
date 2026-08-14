# Zeabur 线上 500 错误修复方案

## 问题分析

### 现象
Zeabur 线上部署的论坛 `https://7891.zeabur.app/` 首页加载失败，控制台报：
```
GET https://7891.zeabur.app/api/questions?sort=hot&limit=6 500 (Internal Server Error)
```

### 根因

在 `server/db/pool.js` 中，当 `DATABASE_URL` 环境变量被设置时，会在模块加载时立即创建 `pg.Pool`：

```js
if (databaseUrl) {
  try {
    pool = new pg.Pool({ connectionString: databaseUrl });
    isDbAvailable = true;  // ← 问题所在：仅验证连接字符串格式，未实际测试连接
  }
}
```

**`pg.Pool` 构造函数只校验连接字符串格式，不实际建立数据库连接。** 因此：

1. 即使 `DATABASE_URL` 配置有误（地址、端口、凭据、数据库名错误），或者 Zeabur 网络无法访问该数据库，`isDbAvailable` 仍为 `true`
2. `server/index.js` 中的中间件检查 `isDbAvailable` 为 `true`，放行请求
3. 路由处理器执行实际 SQL 查询时，`pg` 驱动才真正尝试建立连接，连接失败抛出错误
4. 错误被路由的 `try/catch` 捕获后通过 `next(err)` 传给全局错误处理器
5. 全局错误处理器返回 **500 Internal Server Error**

正确的行为应该是：数据库不可达时返回 **503 Service Unavailable**（当前 `isDbAvailable` 检查中间件的设计意图），但因为未实际验证连接，导致中间件误判数据库可用。

### 次要问题

- `query()` 函数没有连接失败降级处理，一旦连接失败，所有 API 请求都会返回 500
- 池化连接没有监听错误事件，无法动态感知连接断开

## 修复方案

### 修改 1: `server/db/pool.js` — 启动时实际验证数据库连接

在 pool 创建后，立即执行 `SELECT 1` 实际验证连接是否可用。连接失败时 `isDbAvailable = false`，使中间件能正确返回 503。

同时添加 pool 错误事件监听，连接断开时动态更新 `isDbAvailable`。

**改动要点：**
- 启动时用 `pool.query('SELECT 1')` 验证连接
- 失败时销毁 pool、设置 `isDbAvailable = false`
- 添加 `pool.on('error')` 处理连接池级别的错误
- `query()` 函数添加连接失败时的 `isDbAvailable` 动态降级

### 修改 2: `server/index.js` — 启动流程中加入连接验证

服务器启动时，在监听端口前验证数据库连接，确保只有在数据库可用时才对外提供完整服务。

## 涉及文件

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `server/db/pool.js` | 修改 | 添加启动连接验证、pool 错误事件监听、query 降级处理 |
| `server/index.js` | 修改 | 启动时主动验证数据库，增强健康检查 |

## 风险与注意事项

1. **启动时阻塞**：`SELECT 1` 验证会在启动时阻塞数百毫秒（取决于网络延迟），但这是可接受的，因为连接验证失败时应立即知道
2. **连接超时**：`pg.Pool` 默认连接超时较长，可通过 `pool.on('error')` 快速感知失败
3. **Zeabur 环境变量**：用户需确认 Zeabur 控制台的 `DATABASE_URL` 变量值正确（主机、端口、用户名、密码、数据库名）
4. **数据库可达性**：如果 Zeabur 的网络与 PostgreSQL 数据库之间存在防火墙或网络隔离，用户需要在数据库白名单中添加 Zeabur 的出口 IP
5. **数据库 Schema**：首次部署后需执行 `npm run db:seed` 初始化表结构和种子数据
