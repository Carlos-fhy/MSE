# 迷你低代码平台 - 开发进度记录

## 项目概述

基于 Schema 驱动的迷你低代码平台，支持创建多个 MES 系统，每个系统包含多个应用配置。

## 技术栈

### 前端
- React 19 + TypeScript
- Vite
- Ant Design 5
- @dnd-kit (拖拽功能)
- Axios

### 后端
- Node.js + TypeScript
- Express
- Prisma ORM
- SQLite

---

## 已完成功能

### 第一层：低代码引擎核心

#### 1. Schema 配置管理 ✅
- [x] Schema CRUD API (`/api/schemas`)
- [x] 字段类型支持：text, number, date, select, textarea
- [x] 字段属性：key, label, type, required, options, defaultValue
- [x] JSON 字段序列化存储

#### 2. 可视化拖拽设计器 ✅
- [x] 组件面板 (ComponentPanel) - 5种组件类型
- [x] 设计画布 (DesignCanvas) - 支持拖拽排序
- [x] 属性面板 (PropertyPanel) - 编辑字段属性
- [x] @dnd-kit 拖拽实现

#### 3. 动态表单渲染 ✅
- [x] 根据 Schema 动态生成表单
- [x] 支持所有字段类型渲染
- [x] 表单验证（必填字段）

#### 4. 动态数据表格 ✅
- [x] 根据 Schema 动态生成表格列
- [x] 分页支持
- [x] CRUD 操作

#### 5. 通用数据存储 ✅
- [x] DataRecord 表 - 存储动态实体数据
- [x] 支持预定义 Prisma 模型和动态实体
- [x] JSON 数据序列化

### 系统管理功能 ✅

#### 1. 系统层级概念 ✅
- [x] System 模型 - 用于组织多个 Schema
- [x] Schema 关联 System (systemId 外键)
- [x] 系统 CRUD API (`/api/systems`)

#### 2. 系统列表页面 ✅
- [x] 卡片式系统展示
- [x] 显示系统下应用数量
- [x] 显示认证状态标签
- [x] 点击进入系统工作区
- [x] 快速进入配置管理
- [x] 清除登录状态功能

#### 3. 系统工作区 ✅
- [x] 顶部显示当前系统名称
- [x] 菜单只显示当前系统的应用
- [x] 切换系统功能
- [x] 快速进入配置管理

#### 4. 配置管理页面 ✅
- [x] Tabs 切换：系统管理 / 应用配置
- [x] 系统创建/编辑/删除（需要权限）
- [x] 创建应用时选择所属系统
- [x] 表格显示应用所属系统
- [x] 系统管理安全保护（权限检查）

### 中文本地化 ✅
- [x] 所有 UI 文本中文化
- [x] MES 应用名称映射（工单管理、报工记录等）
- [x] 表单标签、按钮、提示信息

### MES 示例数据 ✅
- [x] work-order (工单管理)
- [x] work-report (报工记录)
- [x] quality-check (质检记录)
- [x] equipment (设备管理)
- [x] employee (员工管理)

### 第二层：基础设施（部分完成）

#### 1. 用户认证系统 ✅
- [x] JWT Token 认证
- [x] 登录/登出功能
- [x] 密码加密 (bcrypt)
- [x] 登录页面 UI
- [x] Token 自动注入（Axios 拦截器）
- [x] 401 自动处理
- [x] 多租户登录支持（超级管理员可访问任何系统）
- [x] 修改密码功能
- [ ] Token 刷新机制

#### 2. 系统级认证控制 ✅
- [x] 系统认证开关（isAuthEnabled）
- [x] 路由守卫（根据系统认证状态拦截）
- [x] 系统设置页面
- [x] 动态开启/关闭认证
- [x] 认证状态显示
- [x] 权限控制（系统设置需要 system:update 权限）
- [x] 管理功能访问控制（未登录时自动跳转登录页）
- [x] 后端路由权限保护（防止绕过前端直接调用 API）

#### 3. RBAC 权限基础 ✅
- [x] 数据库模型（User、Role）
- [x] 权限字符串定义
- [x] 通配符权限匹配（*, user:*）
- [x] 按钮级权限控制
- [x] 用户管理页面 UI
- [x] 角色管理页面 UI
- [x] 后端权限中间件

#### 4. 初始数据 ✅
- [x] 4个内置角色（超级管理员、系统管理员、普通用户、只读用户）
- [x] 默认管理员账号（admin/admin123）
- [x] 示例 MES 系统（启用认证）

---



### 第二层：基础设施（继续完善）

#### 1. RBAC 权限系统（完善）✅
- [x] 角色管理（业务逻辑完善）
- [x] 权限定义（更细粒度的权限）
- [x] Token 刷新机制

#### 3. Excel 导入导出 ✅
- [x] 数据导出为 Excel
- [x] Excel 模板下载
- [x] Excel 数据导入
- [x] 数据校验

### 第三层：MES 业务完善 ✅

#### 1. 用户管理配置 ✅
- [x] 添加到 seed.ts（超级管理员、系统管理员、普通用户、只读用户）
- [x] 关联角色（每个用户都关联对应角色）

#### 2. 角色管理配置 ✅
- [x] 添加到 seed.ts（4种内置角色）
- [x] 权限配置（system:*, user:*, role:*, schema:*, data:*）

#### 3. 数据关联 ✅
- [x] 工单关联设备（WorkOrder.equipmentId → Equipment）
- [x] 报工关联工单（WorkReport.workOrderId → WorkOrder）
- [x] 质检关联工单（QualityCheck.workOrderId → WorkOrder）

### 第四层：可视化 ✅

#### 1. 实时看板 ✅
- [x] 数据统计卡片（工单总数、进行中、设备数、今日报工）
- [x] 图表展示（饼图、折线图、柱状图）
- [x] WebSocket 实时刷新
- [x] 近7天趋势分析

#### 2. 甘特图 ✅
- [x] 日/周/月视图切换
- [x] 工单排程展示
- [x] 状态颜色标识
- [x] 优先级显示

---

## 项目结构

```
MSE/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 数据库模型定义
│   │   └── migrations/            # 数据库迁移
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── schemaController.ts
│   │   │   ├── dataController.ts
│   │   │   ├── systemController.ts
│   │   │   ├── authController.ts     # 新增：认证控制器
│   │   │   ├── userController.ts     # 新增：用户控制器
│   │   │   └── roleController.ts     # 新增：角色控制器
│   │   ├── routes/
│   │   │   ├── schema.ts
│   │   │   ├── data.ts
│   │   │   ├── system.ts
│   │   │   ├── auth.ts              # 新增：认证路由
│   │   │   ├── user.ts              # 新增：用户路由
│   │   │   └── role.ts              # 新增：角色路由
│   │   ├── middleware/
│   │   │   └── auth.ts              # 新增：认证中间件
│   │   ├── utils/
│   │   │   ├── prisma.ts
│   │   │   └── auth.ts              # 新增：认证工具函数
│   │   ├── index.ts               # 服务器入口
│   │   └── seed.ts                # 种子数据
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── designer/          # 可视化设计器组件
│   │   │       ├── ComponentPanel.tsx
│   │   │       ├── DesignCanvas.tsx
│   │   │       ├── PropertyPanel.tsx
│   │   │       ├── VisualDesigner.tsx
│   │   │       └── index.ts
│   │   ├── pages/
│   │   │   ├── SchemaConfigPage.tsx
│   │   │   ├── SchemaRuntimePage.tsx
│   │   │   ├── SystemListPage.tsx
│   │   │   ├── LoginPage.tsx          # 新增：登录页面
│   │   │   ├── UserManagementPage.tsx # 新增：用户管理
│   │   │   ├── RoleManagementPage.tsx # 新增：角色管理
│   │   │   └── SystemSettingsPage.tsx # 新增：系统设置
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── schemaService.ts
│   │   │   ├── dataService.ts
│   │   │   ├── systemService.ts
│   │   │   ├── authService.ts         # 新增：认证服务
│   │   │   └── userService.ts         # 新增：用户和角色服务
│   │   ├── types/
│   │   │   └── schema.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
└── PROGRESS.md                    # 本文件
```

---

## 数据库模型

### System（系统）
```prisma
model System {
  id            String   @id @default(uuid())
  name          String   @unique
  description   String?
  isAuthEnabled Boolean  @default(false)  // 新增：认证开关
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  schemas       Schema[]
  users         User[]                     // 新增：用户关联
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

### DataRecord（动态数据）
```prisma
model DataRecord {
  id        String   @id @default(uuid())
  entity    String
  data      String   // JSON
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
  systemId  String?  // null = 超级管理员，有值 = 该系统的用户
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  role      Role     @relation(...)
  system    System?  @relation(...)

  @@unique([username, systemId])  // 复合唯一键：用户名在同一系统内唯一
}
```

### Role（角色）
```prisma
model Role {
  id          String   @id @default(uuid())
  name        String
  description String?
  permissions String   // JSON 数组：["user:*", "data:read"]
  systemId    String?
  isBuiltIn   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  users       User[]
}
```

---

## 运行项目

### 1. 后端
```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

### 2. 前端
```bash
cd frontend
npm install
npm run dev
```

### 3. 访问
- 前端：http://localhost:5173
- 后端：http://localhost:3000
- 健康检查：http://localhost:3000/health

---

## API 端点

### 系统管理
- `GET /api/systems` - 获取所有系统
- `GET /api/systems/:id` - 获取单个系统
- `POST /api/systems` - 创建系统
- `PUT /api/systems/:id` - 更新系统（支持 isAuthEnabled）
- `DELETE /api/systems/:id` - 删除系统

### Schema 管理
- `GET /api/schemas` - 获取所有 Schema
- `GET /api/schemas/:id` - 获取单个 Schema
- `GET /api/schemas/name/:name` - 按名称获取
- `POST /api/schemas` - 创建 Schema
- `PUT /api/schemas/:id` - 更新 Schema
- `DELETE /api/schemas/:id` - 删除 Schema

### 数据管理
- `GET /api/data/:entity` - 获取实体数据（分页）
- `GET /api/data/:entity/:id` - 获取单条数据
- `POST /api/data/:entity` - 创建数据
- `PUT /api/data/:entity/:id` - 更新数据
- `DELETE /api/data/:entity/:id` - 删除数据

### 认证管理（新增）
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码

### 用户管理（新增）
- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取单个用户
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户
- `POST /api/users/:id/reset-password` - 重置用户密码

### 角色管理（新增）
- `GET /api/roles` - 获取角色列表
- `GET /api/roles/:id` - 获取单个角色
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色

---

## 下一步建议

### 优先级高
1. **角色管理完善** - 完善角色管理的业务逻辑
2. **权限体系细化** - 定义更细粒度的权限
3. **Excel 导出** - 数据导出功能

### 优先级中
4. **数据关联** - 实现工单与设备、报工等关联
5. **字段类型扩展** - 添加关联字段类型
6. **表单布局** - 支持多列布局

### 优先级低
7. **实时看板** - 数据统计和图表
8. **甘特图** - 工单排程可视化
9. **移动端适配** - 响应式设计

---

## 权限系统说明

### 权限字符串格式
权限采用 `资源:操作` 的格式，例如：
- `user:read` - 读取用户
- `user:create` - 创建用户
- `user:*` - 用户所有权限
- `*` - 所有权限

### 权限类型
```typescript
系统权限: system:read, system:create, system:update, system:delete, system:*
用户权限: user:read, user:create, user:update, user:delete, user:*
角色权限: role:read, role:create, role:update, role:delete, role:*
配置权限: schema:read, schema:create, schema:update, schema:delete, schema:*
数据权限: data:read, data:create, data:update, data:delete, data:*
```

### 内置角色
1. **超级管理员** - 所有权限 (`["*"]`)
2. **系统管理员** - 系统和配置管理权限
   - `system:read`, `system:update`
   - `user:read`, `user:create`, `user:update`, `user:delete`
   - `role:read`
   - `schema:*`
   - `data:*`
3. **普通用户** - 数据操作 (`data:*`, `schema:read`)
4. **只读用户** - 只读权限 (`data:read`, `schema:read`)

### 权限检查逻辑
- 完全匹配：`user:create` 匹配 `user:create`
- 通配符匹配：`user:*` 匹配所有 `user:xxx`
- 超级权限：`*` 匹配所有权限

---

## 已知问题

1. **Monaco Editor HMR 错误** - 热更新时出现 "custom element already defined"，刷新页面即可
2. **antd v5 React 19 兼容性警告** - 不影响功能，可忽略
3. **TypeScript 未使用变量警告** - `useEffect` 导入但未使用，可清理

## 已修复的问题

1. ✅ **数据库路径配置错误** - DATABASE_URL 指向错误的路径导致无法访问数据库（2025-11-20 修复）
2. ✅ **多租户登录问题** - 超级管理员无法登录到具体系统（2025-11-20 修复）
3. ✅ **系统管理安全漏洞** - 任何人都可以在系统列表页修改/删除系统（2025-11-20 修复）
4. ✅ **认证开关死锁** - 关闭认证后无法重新启用（2025-11-20 修复）
5. ✅ **预定义模型数据隔离** - WorkOrder等预定义模型缺少systemId字段导致数据无法按系统隔离（2025-11-21 修复）
6. ✅ **工单编号全局唯一冲突** - orderNo字段全局唯一导致不同系统不能有相同工单号（2025-11-21 修复）

---

## 更新日志

### 2025-11-21（下午）
- 实现生产看板功能：
  - 数据统计卡片（工单总数、完成率、设备状态、今日报工）
  - 工单状态分布饼图
  - 设备状态分布饼图
  - 近7天产量趋势折线图
  - 近7天工时统计柱状图
  - 近7天质检合格率趋势图
  - 最近工单列表
- 实现甘特图排程：
  - 支持日/周/月视图切换
  - 工单排程可视化展示
  - 状态颜色标识（待处理/进行中/已完成）
  - 优先级颜色标识
- 实现 WebSocket 实时推送：
  - Socket.IO 集成
  - 系统房间隔离
  - 数据变更自动刷新
- 生成大量示例数据：
  - 10台设备
  - 50个工单
  - 149条报工记录
  - 24条质检记录
  - 8名员工
- 进入系统默认显示生产看板

### 2025-11-21
- 修复退出系统时自动登出：
  - 点击"切换系统"按钮时自动清除登录状态
  - 防止切换系统后仍保持之前的登录态
- 实现权限错误友好提示：
  - 403 权限错误显示 Modal 弹窗而非简单 message
  - 使用 App.useApp() hook 解决 antd v5 静态方法问题
  - 显示具体的权限不足原因
- 修复数据隔离问题：
  - 为预定义模型（WorkOrder等）添加 systemId 字段支持
  - 数据查询、创建、更新、删除均按系统隔离
- 修复工单唯一约束问题：
  - 将 orderNo 从全局唯一改为按系统唯一
  - 使用组合唯一约束 @@unique([orderNo, systemId])
  - 不同系统可以有相同的工单编号
- 系统管理员权限增强：
  - 添加 system:update 权限到系统管理员角色
  - 允许系统管理员访问系统设置页面

### 2025-11-20（晚上）
- 实现 Excel 导入导出功能：
  - 创建 excelUtils.ts 工具库
  - 支持数据导出为 Excel 文件
  - 支持下载 Excel 模板（包含字段说明和示例数据）
  - 支持从 Excel 导入数据
  - 完整的数据校验（必填字段、类型检查、选择框选项验证）
  - 在 SchemaRuntimePage 添加导入导出按钮
  - 导入时显示详细错误信息
- 依赖库：安装 xlsx (SheetJS) 用于 Excel 文件操作

### 2025-11-20（下午）
- 修复数据库路径配置问题（DATABASE_URL 路径错误）
- 修复多租户登录逻辑（支持超级管理员访问任何系统）
- 添加系统设置权限控制（需要 system:update 权限）
- 修复系统管理安全漏洞：
  - 移除系统选择页面的编辑/删除功能
  - 添加后端 API 权限保护（system:create, system:update, system:delete）
  - 系统管理操作只能在配置管理页面进行
- 解决"关闭认证后无法重新启用"的死锁问题：
  - 管理功能（系统设置、用户管理、角色管理）始终需要登录
  - 即使系统关闭认证，管理员也可以登录进行配置
  - 登录后自动跳转到之前想访问的管理页面
- 更新超级管理员权限为通配符（*）

### 2025-11-20（上午）
- 实现 JWT 用户认证系统
- 添加登录/登出功能
- 实现系统级认证控制（isAuthEnabled）
- 创建系统设置页面
- 添加路由守卫功能
- 实现用户管理页面 UI
- 实现角色管理页面 UI
- 添加权限中间件和权限检查
- 初始化 4 个内置角色
- 移除进入系统后的"配置"按钮
- 优化 UI 布局和权限控制

### 2024-11-19
- 初始化项目结构
- 完成 Schema CRUD
- 实现可视化拖拽设计器
- 添加动态表单和表格
- 实现 DataRecord 动态数据存储
- 添加 System 层级概念
- 创建系统列表页面
- 实现系统工作区
- 完成中文本地化
- 添加 5 个 MES 示例配置


 生产看板针对的是所有的配置吗 

● 不是，目前生产看板只针对预定义的 MES 模型：

  | 看板数据 | 数据来源            |
  |------|-----------------|
  | 工单统计 | WorkOrder 模型    |
  | 设备状态 | Equipment 模型    |
  | 报工趋势 | WorkReport 模型   |
  | 质检趋势 | QualityCheck 模型 |
  | 甘特图  | WorkOrder 模型    |

  不包括存储在 DataRecord 表中的自定义配置数据（如员工管理 Employee）。

  如果需要看板支持所有配置，需要：
  1. 为 DataRecord 添加统计 API
  2. 或者让所有 schema 都使用预定义模型

  你希望看板也统计自定义配置的数据吗？

> 如果我没有选择工单记录，也会出现这个板块是吗 

● 是的，目前看板是固定显示所有板块的，不管系统是否选择了对应的应用配置。

  如果想让看板根据系统配置动态显示对应板块，需要：

  1. 获取当前系统关联的 schemas
  2. 根据 schemas 决定显示哪些统计模块

  要我实现这个功能吗？比如：
  - 系统有工单配置 → 显示工单统计
  - 系统有设备配置 → 显示设备统计
  - 系统没有报工配置 → 隐藏报工趋势
