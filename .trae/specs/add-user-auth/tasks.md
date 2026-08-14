# Tasks

- [x] Task 1: 后端 — 数据库与依赖
  - [x] SubTask 1.1: 在 `server/db/schema.sql` 新增 `users` 表（id UUID PK, username TEXT UNIQUE, password_hash TEXT, created_at BIGINT）
  - [x] SubTask 1.2: 在 `package.json` 新增 `bcryptjs` 和 `jsonwebtoken` 依赖
  - [x] SubTask 1.3: 运行 `npm install` 安装新依赖

- [x] Task 2: 后端 — 用户仓储层
  - [x] SubTask 2.1: 新建 `server/repositories/userRepository.js`，实现 `createUser(username, passwordHash)` 和 `getUserByUsername(username)` 和 `getUserById(id)`

- [x] Task 3: 后端 — 认证路由与中间件
  - [x] SubTask 3.1: 新建 `server/middleware/auth.js`，解析 `Authorization: Bearer <token>` 头，验证 JWT，设置 `req.user`
  - [x] SubTask 3.2: 新建 `server/routes/auth.js`，实现 `POST /register`（校验 + bcrypt 哈希 + 写库 + 签发 JWT）和 `POST /login`（查库 + bcrypt 比较 + 签发 JWT）
  - [x] SubTask 3.3: 在 `server/index.js` 挂载 `/api/auth` 路由（在 503 中间件之前，不依赖 DB 可用性检查）

- [x] Task 4: 前端 — Auth Service 与 Context
  - [x] SubTask 4.1: 在 `src/constants/forumStorageKeys.js` 新增 `AUTH_TOKEN` 键
  - [x] SubTask 4.2: 新建 `src/services/authService.js`，封装 `register(username, password)` 和 `login(username, password)` 和 `getToken()` / `setToken()` / `removeToken()`
  - [x] SubTask 4.3: 在 `src/services/apiClient.js` 的 `request()` 函数中，如有 token 则自动设置 `Authorization: Bearer <token>` 头
  - [x] SubTask 4.4: 在 `src/contexts/ForumAppContext.jsx` 新增 `user` 状态、`login` / `register` / `logout` 方法，初始化时从 localStorage 读取 token 并验证

- [x] Task 5: 前端 — 登录/注册页面
  - [x] SubTask 5.1: 新建 `src/pages/forum/Login.jsx`，用户名+密码表单，调用 `login()`，成功后跳转首页
  - [x] SubTask 5.2: 新建 `src/pages/forum/Register.jsx`，用户名+密码+确认密码表单，调用 `register()`，成功后跳转首页
  - [x] SubTask 5.3: 在 `src/App.jsx` 新增 `/login` 和 `/register` 路由

- [x] Task 6: 前端 — Navbar 集成
  - [x] SubTask 6.1: 修改 `src/components/forum/Navbar.jsx`，未登录时显示「登录」「注册」按钮，已登录时显示用户名+「退出」按钮

- [x] Task 7: 验证与推送
  - [x] SubTask 7.1: `npm run build` 确认构建通过
  - [x] SubTask 7.2: 提交并推送到 GitHub main 分支

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3（需要后端 API 可用）
- Task 5 depends on Task 4
- Task 6 depends on Task 4
- Task 7 depends on Task 5, Task 6
