# 迷你低代码 MES 平台（对外发布版）

基于 Schema 驱动的迷你低代码平台，支持创建多个 MES 系统，每个系统包含多个应用配置。项目内置可用数据库，开箱即用。

## 功能特性

### 低代码引擎核心

- **可视化拖拽设计器** - 支持5种组件类型（文本、数字、日期、选择、文本域）
- **Schema 配置管理** - 动态配置数据模型和字段
- **动态表单渲染** - 根据 Schema 自动生成表单界面
- **动态数据表格** - 支持分页、CRUD 操作

### 系统管理

- **多系统支持** - 创建和管理多个独立的 MES 系统
- **系统工作区** - 每个系统有独立的应用和数据
- **系统级认证控制** - 可为每个系统单独开启/关闭认证

### 权限管理

- **JWT 认证** - 安全的用户认证机制
- **RBAC 权限** - 基于角色的访问控制
- **多租户支持** - 超级管理员可访问所有系统
- **4种内置角色**：
  - 超级管理员 - 所有权限
  - 系统管理员 - 系统和用户管理
  - 普通用户 - 数据操作
  - 只读用户 - 只读访问

### 数据可视化

- **实时看板** - 数据统计、图表展示、WebSocket 实时刷新
- **甘特图** - 工单排程可视化，支持日/周/月视图切换

### 数据导入导出

- **Excel 导出** - 将数据导出为 Excel 文件
- **Excel 导入** - 从 Excel 批量导入数据
- **模板下载** - 自动生成包含字段说明的导入模板

## 技术栈

### 前端

- React 19 + TypeScript
- Vite
- Ant Design 5
- @dnd-kit（拖拽）
- Socket.IO Client（实时推送）
- XLSX（Excel 处理）
- Axios

### 后端

- Node.js + TypeScript
- Express
- Prisma ORM
- SQLite
- Socket.IO（WebSocket）
- JWT
- bcrypt

## 快速开始

### 环境要求

- Node.js >= 18.0.0（已在 package.json engines 指定）
- npm >= 9.0.0
- Windows / macOS / Linux

### 1 启动后端

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 复制环境变量文件（如不存在）
# Windows PowerShell:
Copy-Item .env.example .env
# macOS/Linux:
# cp .env.example .env

# 生成 Prisma 客户端
npx prisma generate

# 使用内置数据库 dev.db，通常无需初始化
# 如需从零重建数据库，请执行：
# npx prisma db push && npm run seed

# 启动后端（开发模式）
npm run dev
```

后端服务默认运行在 `http://localhost:3000`

### 2 启动前端

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 复制环境变量文件（如不存在）
# Windows PowerShell:
Copy-Item .env.example .env
# macOS/Linux:
# cp .env.example .env

# 启动前端
npm run dev
```

前端服务默认运行在 `http://localhost:5173`

### 3 登录系统

- 用户名：`admin`
- 密码：`admin123`

## 数据库说明（内置 dev.db）

项目已内置可直接使用的 SQLite 数据库：`backend/prisma/dev.db`，包含示例系统、角色与用户等初始化数据。详情与重置方法见：《[数据库说明](./数据库说明.md)》。

## 项目结构

```
MSE/
├── backend/                 # 后端服务
│   ├── prisma/              # 数据库模型与本地数据库
│   │   ├── schema.prisma    # Prisma 数据模型
│   │   └── dev.db           # 已内置的 SQLite 数据库（可直接使用）
│   ├── src/
│   │   ├── controllers/     # 业务逻辑控制器
│   │   ├── routes/          # API 路由
│   │   ├── middleware/      # 中间件（认证等）
│   │   ├── utils/           # 工具函数
│   │   ├── index.ts         # 服务器入口
│   │   └── seed.ts          # 初始数据脚本
│   └── package.json
│
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── components/      # React 组件
│   │   │   └── designer/    # 可视化设计器
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API 服务
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript 类型定义
│   └── package.json
│
├── 发布启动指南.md          # 面向使用者的启动说明
├── 数据库说明.md            # 数据库使用/重置/导入导出指南
├── PROGRESS.md              # 开发进度记录
└── README.md                # 本文件
```

## API 文档（部分）

### 认证管理

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码

### 系统管理

- `GET /api/systems` - 获取系统列表
- `GET /api/systems/:id` - 获取单个系统
- `POST /api/systems` - 创建系统（需要 system:create 权限）
- `PUT /api/systems/:id` - 更新系统（需要 system:update 权限）
- `DELETE /api/systems/:id` - 删除系统（需要 system:delete 权限）

### Schema 管理

- `GET /api/schemas` - 获取 Schema 列表
- `GET /api/schemas/:id` - 获取单个 Schema
- `GET /api/schemas/name/:name` - 按名称获取 Schema
- `POST /api/schemas` - 创建 Schema
- `PUT /api/schemas/:id` - 更新 Schema
- `DELETE /api/schemas/:id` - 删除 Schema

### 数据管理

- `GET /api/data/:entity` - 查询数据（支持分页）
- `GET /api/data/:entity/:id` - 获取单条数据
- `POST /api/data/:entity` - 创建数据
- `PUT /api/data/:entity/:id` - 更新数据
- `DELETE /api/data/:entity/:id` - 删除数据
- `POST /api/data/:entity/export` - 导出 Excel
- `GET /api/data/:entity/template` - 下载导入模板
- `POST /api/data/:entity/import` - 导入 Excel

### 用户管理

- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取单个用户
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户
- `POST /api/users/:id/reset-password` - 重置用户密码

### 角色管理

- `GET /api/roles` - 获取角色列表
- `GET /api/roles/:id` - 获取单个角色
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色

### 看板数据

- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/dashboard/charts` - 获取图表数据

## 权限系统

### 权限字符串格式

权限采用 `资源:操作` 的格式，例如：
- `user:read` - 读取用户
- `user:create` - 创建用户
- `user:*` - 用户所有权限
- `*` - 所有权限

### 权限类型

- `system:*` - 系统管理（read, create, update, delete）
- `user:*` - 用户管理（read, create, update, delete）
- `role:*` - 角色管理（read, create, update, delete）
- `schema:*` - Schema 配置管理（read, create, update, delete）
- `data:*` - 数据管理（read, create, update, delete）

### 内置角色权限

1. **超级管理员** - `["*"]`
2. **系统管理员** - `["system:read", "system:update", "user:*", "role:read", "schema:*", "data:*"]`
3. **普通用户** - `["data:*", "schema:read"]`
4. **只读用户** - `["data:read", "schema:read"]`

## MES 示例功能

项目内置了完整的 MES 示例数据：

- **工单管理** - 生产工单的创建、跟踪和管理
- **报工记录** - 工人报工信息记录
- **质检记录** - 质量检验数据记录
- **设备管理** - 生产设备信息管理
- **员工管理** - 员工基本信息管理

## 数据库模型

### System（系统）

```prisma
model System {
  id            String   @id @default(uuid())
  name          String   @unique
  description   String?
  isAuthEnabled Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  schemas       Schema[]
  users         User[]
}
```

### Schema（配置）

```prisma
model Schema {
  id        String   @id @default(uuid())
  name      String   @unique
  entity    String   @unique
  fields    String   // JSON
  category  String   @default("custom")
  systemId  String?
  system    System?  @relation(...)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### User（用户）

```prisma
model User {
  id        String   @id @default(uuid())
  username  String
  password  String   // bcrypt 加密
  realName  String
  email     String?
  roleId    String
  systemId  String?  // null = 超级管理员
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  role      Role     @relation(...)
  system    System?  @relation(...)

  @@unique([username, systemId])
}
```

### Role（角色）

```prisma
model Role {
  id          String   @id @default(uuid())
  name        String
  description String?
  permissions String   // JSON 数组
  systemId    String?
  isBuiltIn   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  users       User[]
}
```

## 文档与支持

- 《[发布启动指南](./发布启动指南.md)》
- 《[数据库说明](./数据库说明.md)》
- 《[功能特性清单](./功能特性清单.md)》
- 《[本地启动指南](./本地启动指南.md)》
- 《[开发进度](./PROGRESS.md)》

## 生产部署（简要）

- 后端：`npm run build && npm run start`，配置 `backend/.env`（务必更换 `JWT_SECRET`）
- 前端：`npm run build`，将 `dist/` 交由静态服务器托管
- 数据库：SQLite 适合开发/小型部署，生产建议迁移到 PostgreSQL/MySQL

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT

## 相关链接

- [React](https://react.dev/)
- [Ant Design](https://ant.design/)
- [Prisma](https://www.prisma.io/)
- [Express](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
