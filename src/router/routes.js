/**
 * 路由表定义（与 router/index.js 分离，避免 Layout ↔ Router 循环依赖）
 * Layout 使用懒加载组件（() => import），仅在首个受保护路由渲染时加载。
 * meta.roles 与《需求规格说明书》2.5 角色-模块权限矩阵一致。
 */
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/404',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true }
  }
]

export const asyncRoutes = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'Odometer', roles: [], keepAlive: true }
      },
      {
        path: 'notices',
        name: 'NoticeManage',
        component: () => import('@/views/notice/index.vue'),
        meta: { title: '通知公告', icon: 'Bell', roles: ['ROLE_ADMIN', 'ROLE_HR'] }
      }
    ]
  },
  {
    path: '/employee',
    component: () => import('@/layout/index.vue'),
    meta: { title: '员工信息', icon: 'User', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_FINANCE'] },
    children: [
      {
        path: '',
        name: 'EmployeeList',
        component: () => import('@/views/employee/index.vue'),
        meta: { title: '员工档案', icon: 'Notebook', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_FINANCE'] }
      },
      {
        path: 'changes',
        name: 'EmployeeChange',
        component: () => import('@/views/employee/changes.vue'),
        meta: { title: '异动记录', icon: 'Switch', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER'] }
      },
      {
        path: 'contracts',
        name: 'EmployeeContract',
        component: () => import('@/views/employee/contracts.vue'),
        meta: { title: '合同管理', icon: 'Postcard', roles: ['ROLE_ADMIN', 'ROLE_HR'] }
      },
      {
        path: 'profile',
        name: 'MyProfile',
        component: () => import('@/views/employee/profile.vue'),
        meta: { title: '我的档案', icon: 'Postcard', roles: ['ROLE_EMPLOYEE'] }
      }
    ]
  },
  {
    path: '/dept',
    component: () => import('@/layout/index.vue'),
    meta: { title: '部门管理', icon: 'OfficeBuilding', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_EXECUTIVE'] },
    children: [
      {
        path: '',
        name: 'DeptTree',
        component: () => import('@/views/dept/index.vue'),
        meta: { title: '组织架构', icon: 'Share', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_EXECUTIVE'] }
      },
      {
        path: 'positions',
        name: 'PositionList',
        component: () => import('@/views/dept/positions.vue'),
        meta: { title: '岗位管理', icon: 'Stamp', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER'] }
      }
    ]
  },
  {
    path: '/attendance',
    component: () => import('@/layout/index.vue'),
    meta: { title: '考勤管理', icon: 'AlarmClock', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_FINANCE', 'ROLE_EMPLOYEE'] },
    children: [
      {
        path: 'checkin',
        name: 'AttendanceCheckin',
        component: () => import('@/views/attendance/checkin.vue'),
        meta: { title: '打卡签到', icon: 'AlarmClock', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_FINANCE', 'ROLE_EMPLOYEE'] }
      },
      {
        path: 'leave',
        name: 'LeaveRequest',
        component: () => import('@/views/attendance/leave.vue'),
        meta: { title: '请假申请', icon: 'Umbrella', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] }
      },
      {
        path: 'overtime',
        name: 'OvertimeRequest',
        component: () => import('@/views/attendance/overtime.vue'),
        meta: { title: '加班申请', icon: 'Timer', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] }
      },
      {
        path: 'trip',
        name: 'BusinessTrip',
        component: () => import('@/views/attendance/trip.vue'),
        meta: { title: '出差管理', icon: 'Suitcase', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] }
      },
      {
        path: 'monthly',
        name: 'AttendanceMonthly',
        component: () => import('@/views/attendance/monthly.vue'),
        meta: { title: '考勤统计', icon: 'DataAnalysis', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER'] }
      }
    ]
  },
  {
    path: '/salary',
    component: () => import('@/layout/index.vue'),
    meta: { title: '薪资管理', icon: 'Money', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_FINANCE', 'ROLE_EMPLOYEE'] },
    children: [
      {
        path: 'standard',
        name: 'SalaryStandard',
        component: () => import('@/views/salary/standard.vue'),
        meta: { title: '薪资标准', icon: 'PriceTag', roles: ['ROLE_HR', 'ROLE_FINANCE'] }
      },
      {
        path: 'record',
        name: 'SalaryRecord',
        component: () => import('@/views/salary/record.vue'),
        meta: { title: '薪资核算', icon: 'Tickets', roles: ['ROLE_HR', 'ROLE_FINANCE', 'ROLE_MANAGER'] }
      },
      {
        path: 'payslip',
        name: 'MyPayslip',
        component: () => import('@/views/salary/payslip.vue'),
        meta: { title: '我的薪资条', icon: 'Wallet', roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_FINANCE', 'ROLE_EMPLOYEE'] }
      }
    ]
  },
  {
    path: '/recruit',
    component: () => import('@/layout/index.vue'),
    meta: { title: '招聘管理', icon: 'Aim', roles: ['ROLE_HR', 'ROLE_MANAGER', 'ROLE_EXECUTIVE'] },
    children: [
      {
        path: 'request',
        name: 'RecruitRequest',
        component: () => import('@/views/recruit/request.vue'),
        meta: { title: '招聘需求', icon: 'DocumentAdd', roles: ['ROLE_HR', 'ROLE_MANAGER', 'ROLE_EXECUTIVE'] }
      },
      {
        path: 'candidate',
        name: 'CandidateList',
        component: () => import('@/views/recruit/candidate.vue'),
        meta: { title: '简历筛选', icon: 'Files', roles: ['ROLE_HR', 'ROLE_MANAGER'] }
      },
      {
        path: 'offer',
        name: 'OfferList',
        component: () => import('@/views/recruit/offer.vue'),
        meta: { title: '录用审批', icon: 'CircleCheck', roles: ['ROLE_HR', 'ROLE_MANAGER'] }
      }
    ]
  },
  {
    path: '/training',
    component: () => import('@/layout/index.vue'),
    meta: { title: '培训管理', icon: 'Reading', roles: ['ROLE_HR', 'ROLE_MANAGER', 'ROLE_EMPLOYEE', 'ROLE_EXECUTIVE'] },
    children: [
      {
        path: 'plan',
        name: 'TrainingPlan',
        component: () => import('@/views/training/plan.vue'),
        meta: { title: '培训计划', icon: 'Notebook', roles: ['ROLE_HR', 'ROLE_MANAGER', 'ROLE_EXECUTIVE'] }
      },
      {
        path: 'my',
        name: 'MyTraining',
        component: () => import('@/views/training/my.vue'),
        meta: { title: '我的培训', icon: 'Collection', roles: ['ROLE_HR', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] }
      }
    ]
  },
  {
    path: '/performance',
    component: () => import('@/layout/index.vue'),
    meta: { title: '绩效考核', icon: 'TrophyBase', roles: ['ROLE_HR', 'ROLE_MANAGER', 'ROLE_EMPLOYEE', 'ROLE_EXECUTIVE'] },
    children: [
      {
        path: 'plan',
        name: 'PerfPlan',
        component: () => import('@/views/performance/plan.vue'),
        meta: { title: '考核方案', icon: 'SetUp', roles: ['ROLE_HR', 'ROLE_EXECUTIVE'] }
      },
      {
        path: 'record',
        name: 'PerfRecord',
        component: () => import('@/views/performance/record.vue'),
        meta: { title: '绩效评分', icon: 'EditPen', roles: ['ROLE_HR', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] }
      }
    ]
  },
  {
    path: '/system',
    component: () => import('@/layout/index.vue'),
    meta: { title: '系统设置', icon: 'Setting', roles: ['ROLE_ADMIN', 'ROLE_EXECUTIVE'] },
    children: [
      {
        path: 'user',
        name: 'SysUser',
        component: () => import('@/views/system/user.vue'),
        meta: { title: '用户管理', icon: 'Avatar', roles: ['ROLE_ADMIN'] }
      },
      {
        path: 'role',
        name: 'SysRole',
        component: () => import('@/views/system/role.vue'),
        meta: { title: '角色权限', icon: 'Key', roles: ['ROLE_ADMIN'] }
      },
      {
        path: 'dict',
        name: 'SysDict',
        component: () => import('@/views/system/dict.vue'),
        meta: { title: '数据字典', icon: 'Collection', roles: ['ROLE_ADMIN'] }
      },
      {
        path: 'config',
        name: 'SysConfig',
        component: () => import('@/views/system/config.vue'),
        meta: { title: '参数配置', icon: 'Tools', roles: ['ROLE_ADMIN'] }
      },
      {
        path: 'log',
        name: 'SysLog',
        component: () => import('@/views/system/log.vue'),
        meta: { title: '日志审计', icon: 'Document', roles: ['ROLE_ADMIN'] }
      }
    ]
  },
  // 兜底：未匹配路由重定向 404（需最后注册）
  { path: '/:pathMatch(.*)*', redirect: '/404', meta: { hidden: true } }
]
