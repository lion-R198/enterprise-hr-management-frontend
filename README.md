# 企业人事管理系统前端（enterprise-hr-management-frontend）

Vue 3 + Element Plus + Vite 前后端分离项目，对接《企业人事管理系统需求规格说明书》（9 模块 / 52 功能点）与 `enterprise_hr_schema.sql`（49 张表）。

## 技术栈

- Vue 3.5 + Vue Router 4（动态路由 + RBAC 守卫）+ Pinia
- Element Plus 2.8 + ECharts 5
- Vite 5（Node ≥ 18，本项目使用本机托管 Node 22.22.2）
- 依赖安装在项目本地 `node_modules`，未使用全局安装

## 运行

```bash
npm install --registry=https://registry.npmmirror.com
npm run dev          # http://localhost:5173
npm run build        # 生产构建
npm run check:mock   # mock handler 静态检查（ctx 字段未解构即使用 → ReferenceError）
npm run audit:api    # 契约审计 + 数据表覆盖校验（产出 verify/api-audit-report.json）
npm run test:api     # 接口清单 + mock 静态检查 + 契约审计 一次跑完
```

## 接口运行时测试（E2E）与《前端测试用例.xlsx》

- **运行时测试页**：dev server 启动后访问 `http://localhost:5173/dev/api-test.html`，
  113 条端到端用例覆盖全部 91 个请求地址（5 类角色 + 数据范围 + 业务规则拦截断言），
  走真实请求管线（`request.js` → mock 分发器）；
- **《前端测试用例.xlsx》**（项目根目录）5 个工作表：
  `二次校验报告`（KPI 公式联动 + 结论 + 风险建议）/ `接口清单`（91 个请求地址 ↔ 数据表 ↔ 页面 ↔ 角色）/
  `前端测试用例`（113 条实测用例，含预期/实测/耗时，"是否通过"列可复用做回归）/ `数据表覆盖校验`（49 张表逐表说明）/
  `本地配置数据`（允许留在前端 js 的配置及判定依据）；
- **对接真实后端**：将 `.env.production` 的 `VITE_USE_MOCK` 保持 `false`、后端按《接口清单》实现同路径接口即可，业务代码零改动；
  回归时重跑 `dev/api-test.html` 并勾选《前端测试用例》"是否通过"列。

## 演示账号（mock 通道，密码均为 123456）

| 账号 | 角色 | 说明 |
| --- | --- | --- |
| admin | ROLE_ADMIN | 系统设置全权，业务数据只读 |
| hr01 | ROLE_HR | 员工全生命周期、考勤汇总、薪资核算 |
| mgr01 | ROLE_MANAGER | 本部门审批、绩效评分 |
| fin01 | ROLE_FINANCE | 薪资标准、复核与发放 |
| emp01 | ROLE_EMPLOYEE | 打卡、请假、薪资条、自评（仅本人数据） |
| exe01 | ROLE_EXECUTIVE | 只读汇总看板 |

## 双通道设计（mock ↔ 真实 API）

- `.env.development` 中 `VITE_USE_MOCK=true` 时全部请求走 `src/mock`（返回"已解包 data"，与 axios 拦截器契约一致）；
- 改为 `false` 后自动切换 axios 实例，`/api` 代理到 `VITE_PROXY_TARGET`（Spring Boot 3 后端），**业务代码零改动**；
- mock 令牌格式 `mock-jwt.<userId>.<ts>`，mock 侧仅校验格式并解码还原用户（模拟 JWT）。

## 工程要点

- **统一请求**：`src/utils/request.js` 单一入口，`{code,message,data}` 信封解包、401 踢出、业务报错统一提示；
- **令牌管理**：`src/utils/auth.js`，localStorage 持久化 + 刷新后路由守卫调 `/auth/me` 重建会话；
- **路由守卫**：`src/permission.js`，白名单、动态注册 `asyncRoutes`（`meta.roles` 与需求 2.5 权限矩阵一致）、fail-close；
- **状态管理**：`store/modules/user.js`（token/用户/角色）、`app.js`（UI）；
- **业务字典**：`src/dict/index.js` 与 DB 字段注释一一同源，页面禁止硬编码枚举文案/颜色；
- **业务规则落 mock**：BR-02-01 工号自动生成、BR-03-02 有员工禁删部门、BR-04-01 请假重叠校验、BR-04-03 封账禁改、BR-05-02 未封账禁核算、BR-05-03 复核≠核算、BR-06-01 阶段不可回退、BR-09-02 管理员自保等；
- **数据脱敏**：身份证/手机号/银行卡在 mock 数据层直接脱敏（NF-08）。

## 目录结构

```
src/
  api/          # 按业务域拆分，接口路径即后端契约（/api 前缀在 request 层拼接）
  config/dict/  # 业务字典（与 sys_dict / 字段注释同源）
  mock/         # db.js 内存数据集 + index.js 路由分发器（支持 :id 参数、令牌校验、数据范围过滤）
  router/       # constantRoutes + asyncRoutes（meta.roles 角色矩阵）
  store/modules/
  utils/        # request.js / auth.js / format.js
  layout/       # 深炭蓝侧边栏 + 顶栏
  views/        # login / dashboard / notice / employee / dept / attendance / salary / recruit / training / performance / system / error
scripts/
  api-contract-audit.mjs   # 契约审计 + 数据表覆盖校验（npm run audit:api，产出 verify/api-audit-report.json）
  api-inventory.mjs        # 接口清单导出（从 src/api 提取 url/method/说明）
  check-mock-ctx.mjs       # mock handler 静态检查（ctx 字段未解构）
  extract-api-result.mjs   # 从无头浏览器 DOM 提取运行时测试结果
dev/
  api-test.html/js         # 接口运行时测试（E2E）页面，npm run dev 后访问 /dev/api-test.html
verify/
  api-audit-report.json    # 审计报告（生成 xlsx 的数据源）
  api-runtime-result.json  # 运行时测试结果
  *.png                    # 各角色页面截图验收
前端测试用例.xlsx           # 交付物：接口清单 + 测试用例 + 表覆盖 + 本地配置 + 二次校验报告
```
