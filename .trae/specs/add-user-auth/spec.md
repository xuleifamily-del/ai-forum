# 用户注册与登录功能 Spec

## Why
论坛已接入 PostgreSQL 后端并部署上线，当前仅靠 localStorage 自动生成匿名身份（AnonymousIdentity）标识用户。需要新增注册与登录功能，让用户凭用户名+密码创建账号并持久化登录状态，登录后将已有匿名身份关联到数据库用户账号。

## What Changes
- 新增 PostgreSQL `users` 表（id / username / password_hash / created_at）
- 新增后端 `/api/auth/register` 和 `/api/auth/login` 路由，使用 bcrypt 哈希密码 + JWT 签发 token
- 新增后端 auth 中间件，从 `Authorization: Bearer <token>` 解析用户身份
- 新增前端 `/login` 和 `/register` 路由页面
- 新增前端 `authService.js` 封装注册/登录 API 调用
- 前端 `apiClient.js` 请求时自动附带 JWT token
- 前端 `ForumAppContext` 新增 `user` / `login` / `logout` / `register` 状态与方法
- Navbar 展示登录/注册按钮或用户名+退出按钮
- 登录后将 AnonymousIdentity 关联到用户账号（提问/回答时 authorId 使用用户账号 ID）
- 新增 `bcryptjs` 和 `jsonwebtoken` 依赖

## Impact
- Affected specs: `integrate-postgresql-backend`
- Affected code:
  - `server/db/schema.sql` — 新增 users 表
  - `server/db/pool.js` — initSchema 自动建 users 表
  - `server/index.js` — 挂载 auth 路由，启动时建表
  - `server/routes/auth.js`（新建）— 注册/登录接口
  - `server/middleware/auth.js`（新建）— JWT 验证中间件
  - `server/repositories/userRepository.js`（新建）— 用户 CRUD
  - `src/App.jsx` — 新增 /login /register 路由
  - `src/contexts/ForumAppContext.jsx` — 新增 auth 状态
  - `src/services/authService.js`（新建）— 前端 auth API 封装
  - `src/services/apiClient.js` — 请求附带 token
  - `src/components/forum/Navbar.jsx` — 登录/注册/退出 UI
  - `src/pages/forum/Login.jsx`（新建）— 登录页
  - `src/pages/forum/Register.jsx`（新建）— 注册页
  - `src/constants/forumStorageKeys.js` — 新增 AUTH_TOKEN 键
  - `package.json` — 新增 bcryptjs / jsonwebtoken 依赖

## ADDED Requirements

### Requirement: 用户注册
系统 SHALL 提供注册接口 `POST /api/auth/register`，接收 `username`（3-20 字符）和 `password`（6-64 字符），使用 bcrypt 哈希密码后存入 `users` 表，返回 JWT token。

#### Scenario: 注册成功
- **WHEN** 用户提交有效的用户名和密码
- **THEN** 系统创建用户记录，返回 `{ token, user: { id, username } }`

#### Scenario: 用户名已存在
- **WHEN** 用户提交已存在的用户名
- **THEN** 系统返回 409 `{ error: "username already exists" }`

#### Scenario: 字段校验失败
- **WHEN** 用户名长度 <3 或 >20，或密码长度 <6 或 >64
- **THEN** 系统返回 400 `{ error: "validation failed" }`

### Requirement: 用户登录
系统 SHALL 提供登录接口 `POST /api/auth/login`，接收 `username` 和 `password`，验证密码后返回 JWT token。

#### Scenario: 登录成功
- **WHEN** 用户提交正确的用户名和密码
- **THEN** 系统返回 `{ token, user: { id, username } }`

#### Scenario: 凭据错误
- **WHEN** 用户名不存在或密码不匹配
- **THEN** 系统返回 401 `{ error: "invalid credentials" }`

### Requirement: JWT 认证中间件
系统 SHALL 提供认证中间件，从 `Authorization` 头解析 Bearer token，验证签名后将 `req.user` 注入请求上下文。

#### Scenario: 有效 token
- **WHEN** 请求携带有效 JWT
- **THEN** 中间件设置 `req.user = { id, username }`，放行请求

#### Scenario: 无效或缺失 token
- **WHEN** 请求未携带 token 或 token 无效/过期
- **THEN** 中间件返回 401 `{ error: "unauthorized" }`

### Requirement: 前端登录/注册页面
系统 SHALL 提供 `/login` 和 `/register` 路由页面，包含用户名/密码输入表单与提交逻辑。

#### Scenario: 注册流程
- **WHEN** 用户在 `/register` 填写用户名和密码并提交
- **THEN** 调用注册 API，成功后存储 token 到 localStorage，跳转首页

#### Scenario: 登录流程
- **WHEN** 用户在 `/login` 填写用户名和密码并提交
- **THEN** 调用登录 API，成功后存储 token 到 localStorage，跳转首页

### Requirement: Navbar 认证状态展示
系统 SHALL 在导航栏根据登录状态展示不同 UI 元素。

#### Scenario: 未登录
- **WHEN** 用户未登录
- **THEN** Navbar 显示「登录」和「注册」按钮

#### Scenario: 已登录
- **WHEN** 用户已登录
- **THEN** Navbar 显示用户名和「退出」按钮

### Requirement: API 请求附带 token
系统 SHALL 在所有 `/api` 请求（除 `/api/auth/*` 和 `/api/health`）的 `Authorization` 头中附带 JWT token（如已登录）。

#### Scenario: 已登录用户发请求
- **WHEN** 用户已登录并发起 API 请求
- **THEN** apiClient 自动从 localStorage 读取 token 并设置 `Authorization: Bearer <token>` 头

## MODIFIED Requirements

### Requirement: ForumAppContext 全局状态
ForumAppContext SHALL 新增 `user`（当前登录用户或 null）、`login(username, password)`、`register(username, password)`、`logout()` 方法。登录/注册成功后设置 `user` 状态；退出时清除 `user` 和 localStorage 中的 token。
