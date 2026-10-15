/**
 * 业务字典（与 enterprise_hr_schema.sql 字段 COMMENT 同源）
 * 页面禁止硬编码枚举文案/颜色，统一从字典取值（F-09-04 数据字典）。
 * tag 取值：'' 默认蓝 / success / warning / danger / info
 */
export const DICT = {
  /** 公共状态:1启用 0停用 */
  commonStatus: [
    { value: 1, label: '启用', tag: 'success' },
    { value: 0, label: '停用', tag: 'danger' }
  ],
  /** 性别:M男 F女 U未知 (employee.gender) */
  gender: [
    { value: 'M', label: '男', tag: '' },
    { value: 'F', label: '女', tag: 'warning' },
    { value: 'U', label: '未知', tag: 'info' }
  ],
  /** 在职状态:0离职 1在职 2试用 3待入职 (employee.status) */
  employeeStatus: [
    { value: 1, label: '在职', tag: 'success' },
    { value: 2, label: '试用', tag: '' },
    { value: 3, label: '待入职', tag: 'warning' },
    { value: 0, label: '离职', tag: 'info' }
  ],
  /** 用工性质:1正式 2试用 3实习 4兼职 5劳务 */
  employeeType: [
    { value: 1, label: '正式', tag: 'success' },
    { value: 2, label: '试用', tag: '' },
    { value: 3, label: '实习', tag: 'info' },
    { value: 4, label: '兼职', tag: 'info' },
    { value: 5, label: '劳务', tag: 'info' }
  ],
  /** 最高学历:1博士 2硕士 3本科 4大专 5中专 6高中 7其他 */
  education: [
    { value: 1, label: '博士', tag: '' },
    { value: 2, label: '硕士', tag: '' },
    { value: 3, label: '本科', tag: '' },
    { value: 4, label: '大专', tag: '' },
    { value: 5, label: '中专', tag: 'info' },
    { value: 6, label: '高中', tag: 'info' },
    { value: 7, label: '其他', tag: 'info' }
  ],
  /** 婚姻状况:1未婚 2已婚 3离异 4丧偶 */
  maritalStatus: [
    { value: 1, label: '未婚' },
    { value: 2, label: '已婚' },
    { value: 3, label: '离异' },
    { value: 4, label: '丧偶' }
  ],
  /** 政治面貌:1群众 2共青团员 3中共党员 4民主党派 */
  politicalStatus: [
    { value: 1, label: '群众' },
    { value: 2, label: '共青团员' },
    { value: 3, label: '中共党员' },
    { value: 4, label: '民主党派' }
  ],
  /** 组织类型:1公司 2中心/事业部 3部门 4班组 (dept.dept_type) */
  deptType: [
    { value: 1, label: '公司', tag: 'danger' },
    { value: 2, label: '事业部', tag: 'warning' },
    { value: 3, label: '部门', tag: '' },
    { value: 4, label: '班组', tag: 'info' }
  ],
  /** 岗位序列:1管理 2技术 3职能 4操作 (position.position_seq) */
  positionSeq: [
    { value: 1, label: '管理序列', tag: 'danger' },
    { value: 2, label: '技术序列', tag: '' },
    { value: 3, label: '职能序列', tag: 'warning' },
    { value: 4, label: '操作序列', tag: 'info' }
  ],
  /** 员工异动类型:1入职 2转正 3调岗 4调部门 5晋升 6降级 7离职 8返聘 (employee_change.change_type) */
  changeType: [
    { value: 1, label: '入职', tag: 'success' },
    { value: 2, label: '转正', tag: 'success' },
    { value: 3, label: '调岗', tag: '' },
    { value: 4, label: '调部门', tag: '' },
    { value: 5, label: '晋升', tag: 'warning' },
    { value: 6, label: '降级', tag: 'danger' },
    { value: 7, label: '离职', tag: 'info' },
    { value: 8, label: '返聘', tag: '' }
  ],
  /** 申请单审批状态:0草稿 1审批中 2已通过 3已驳回 4已撤销 (leave/overtime/trip) */
  approvalStatus: [
    { value: 0, label: '草稿', tag: 'info' },
    { value: 1, label: '审批中', tag: 'warning' },
    { value: 2, label: '已通过', tag: 'success' },
    { value: 3, label: '已驳回', tag: 'danger' },
    { value: 4, label: '已撤销', tag: 'info' }
  ],
  /** 考勤结果:1正常 2迟到 3早退 4缺卡 5旷工 6休假 7出差 8调休 (attendance_record.attendance_status) */
  attendanceStatus: [
    { value: 1, label: '正常', tag: 'success' },
    { value: 2, label: '迟到', tag: 'warning' },
    { value: 3, label: '早退', tag: 'warning' },
    { value: 4, label: '缺卡', tag: 'danger' },
    { value: 5, label: '旷工', tag: 'danger' },
    { value: 6, label: '休假', tag: 'info' },
    { value: 7, label: '出差', tag: '' },
    { value: 8, label: '调休', tag: 'info' }
  ],
  /** 上班打卡状态:1正常 2迟到 3严重迟到 */
  checkInStatus: [
    { value: 1, label: '正常', tag: 'success' },
    { value: 2, label: '迟到', tag: 'warning' },
    { value: 3, label: '严重迟到', tag: 'danger' }
  ],
  /** 下班打卡状态:1正常 2早退 3缺卡 */
  checkOutStatus: [
    { value: 1, label: '正常', tag: 'success' },
    { value: 2, label: '早退', tag: 'warning' },
    { value: 3, label: '缺卡', tag: 'danger' }
  ],
  /** 封账状态:0未封账 1已封账 (attendance_month.lock_status) */
  lockStatus: [
    { value: 0, label: '未封账', tag: 'warning' },
    { value: 1, label: '已封账', tag: 'success' }
  ],
  /** 加班类型:1工作日 2休息日 3法定节假日 */
  overtimeType: [
    { value: 1, label: '工作日', tag: '' },
    { value: 2, label: '休息日', tag: 'warning' },
    { value: 3, label: '法定节假日', tag: 'danger' }
  ],
  /** 补偿方式:1调休 2计薪 */
  compensateType: [
    { value: 1, label: '调休', tag: 'info' },
    { value: 2, label: '计薪', tag: 'success' }
  ],
  /** 交通方式:1飞机 2高铁 3汽车 4自驾 5其他 */
  transport: [
    { value: 1, label: '飞机' },
    { value: 2, label: '高铁' },
    { value: 3, label: '汽车' },
    { value: 4, label: '自驾' },
    { value: 5, label: '其他' }
  ],
  /** 发放状态:0待核算 1已核算 2已复核 3已发放 4发放失败 (salary_record.pay_status) */
  payStatus: [
    { value: 0, label: '待核算', tag: 'info' },
    { value: 1, label: '已核算', tag: '' },
    { value: 2, label: '已复核', tag: 'warning' },
    { value: 3, label: '已发放', tag: 'success' },
    { value: 4, label: '发放失败', tag: 'danger' }
  ],
  /** 合同状态:1生效中 2已到期 3已续签 4已解除 5已终止 */
  contractStatus: [
    { value: 1, label: '生效中', tag: 'success' },
    { value: 2, label: '已到期', tag: 'info' },
    { value: 3, label: '已续签', tag: '' },
    { value: 4, label: '已解除', tag: 'danger' },
    { value: 5, label: '已终止', tag: 'danger' }
  ],
  /** 合同类型:1固定期限 2无固定期限 3以完成任务为期限 4实习协议 5劳务协议 */
  contractType: [
    { value: 1, label: '固定期限' },
    { value: 2, label: '无固定期限' },
    { value: 3, label: '任务期限' },
    { value: 4, label: '实习协议' },
    { value: 5, label: '劳务协议' }
  ],
  /** 招聘需求审批:0草稿 1审批中 2已通过 3已驳回 */
  recruitApproval: [
    { value: 0, label: '草稿', tag: 'info' },
    { value: 1, label: '审批中', tag: 'warning' },
    { value: 2, label: '已通过', tag: 'success' },
    { value: 3, label: '已驳回', tag: 'danger' }
  ],
  /** 需求状态:1进行中 2已完成 3已取消 */
  recruitStatus: [
    { value: 1, label: '进行中', tag: '' },
    { value: 2, label: '已完成', tag: 'success' },
    { value: 3, label: '已取消', tag: 'info' }
  ],
  /** 紧急程度:1普通 2紧急 3非常紧急 */
  recruitUrgency: [
    { value: 1, label: '普通', tag: 'info' },
    { value: 2, label: '紧急', tag: 'warning' },
    { value: 3, label: '非常紧急', tag: 'danger' }
  ],
  /** 候选人阶段:1待筛选 2待面试 3面试中 4待录用 5已录用 6已淘汰 (BR-06-01 流转) */
  candidateStage: [
    { value: 1, label: '待筛选', tag: 'info' },
    { value: 2, label: '待面试', tag: '' },
    { value: 3, label: '面试中', tag: 'warning' },
    { value: 4, label: '待录用', tag: '' },
    { value: 5, label: '已录用', tag: 'success' },
    { value: 6, label: '已淘汰', tag: 'danger' }
  ],
  /** 面试类型:1初试 2复试 3终试 4HR面谈 */
  interviewType: [
    { value: 1, label: '初试' },
    { value: 2, label: '复试' },
    { value: 3, label: '终试' },
    { value: 4, label: 'HR面谈' }
  ],
  /** 面试结论:1通过 2待定 3淘汰 */
  interviewConclusion: [
    { value: 1, label: '通过', tag: 'success' },
    { value: 2, label: '待定', tag: 'warning' },
    { value: 3, label: '淘汰', tag: 'danger' }
  ],
  /** Offer状态:1待发送 2已发送 3已接受 4已拒绝 5已过期 6已入职 */
  offerStatus: [
    { value: 1, label: '待发送', tag: 'info' },
    { value: 2, label: '已发送', tag: '' },
    { value: 3, label: '已接受', tag: 'success' },
    { value: 4, label: '已拒绝', tag: 'danger' },
    { value: 5, label: '已过期', tag: 'info' },
    { value: 6, label: '已入职', tag: 'success' }
  ],
  /** 培训类型:1新员工 2专业技能 3管理能力 4通用素质 5合规培训 */
  trainType: [
    { value: 1, label: '新员工', tag: '' },
    { value: 2, label: '专业技能', tag: 'success' },
    { value: 3, label: '管理能力', tag: 'warning' },
    { value: 4, label: '通用素质', tag: 'info' },
    { value: 5, label: '合规培训', tag: 'danger' }
  ],
  /** 培训计划状态:1草稿 2已发布 3进行中 4已完成 5已取消 */
  trainPlanStatus: [
    { value: 1, label: '草稿', tag: 'info' },
    { value: 2, label: '已发布', tag: '' },
    { value: 3, label: '进行中', tag: 'warning' },
    { value: 4, label: '已完成', tag: 'success' },
    { value: 5, label: '已取消', tag: 'danger' }
  ],
  /** 签到状态:0未签到 1已签到 2缺席 */
  signInStatus: [
    { value: 0, label: '未签到', tag: 'info' },
    { value: 1, label: '已签到', tag: 'success' },
    { value: 2, label: '缺席', tag: 'danger' }
  ],
  /** 考核结果:0未考核 1合格 2不合格 */
  passStatus: [
    { value: 0, label: '未考核', tag: 'info' },
    { value: 1, label: '合格', tag: 'success' },
    { value: 2, label: '不合格', tag: 'danger' }
  ],
  /** 考核周期:1月度 2季度 3半年度 4年度 */
  periodType: [
    { value: 1, label: '月度' },
    { value: 2, label: '季度' },
    { value: 3, label: '半年度' },
    { value: 4, label: '年度' }
  ],
  /** 考核方案状态:1草稿 2已发布 3评分中 4已结束 */
  perfPlanStatus: [
    { value: 1, label: '草稿', tag: 'info' },
    { value: 2, label: '已发布', tag: '' },
    { value: 3, label: '评分中', tag: 'warning' },
    { value: 4, label: '已结束', tag: 'success' }
  ],
  /** 绩效流程状态:1待自评 2待主管评 3待复核 4待员工确认 5已完成 */
  perfStatus: [
    { value: 1, label: '待自评', tag: 'info' },
    { value: 2, label: '待主管评', tag: 'warning' },
    { value: 3, label: '待复核', tag: '' },
    { value: 4, label: '待员工确认', tag: 'warning' },
    { value: 5, label: '已完成', tag: 'success' }
  ],
  /** 绩效等级:S/A/B/C/D */
  perfGrade: [
    { value: 'S', label: 'S 优秀', tag: 'danger' },
    { value: 'A', label: 'A 良好', tag: 'success' },
    { value: 'B', label: 'B 合格', tag: '' },
    { value: 'C', label: 'C 待改进', tag: 'warning' },
    { value: 'D', label: 'D 不合格', tag: 'danger' }
  ],
  /** 员工确认状态:0待确认 1已确认 2已申诉 */
  confirmStatus: [
    { value: 0, label: '待确认', tag: 'warning' },
    { value: 1, label: '已确认', tag: 'success' },
    { value: 2, label: '已申诉', tag: 'danger' }
  ],
  /** 公告类型:1公司制度 2放假通知 3人事公告 4活动通知 5其他 */
  noticeType: [
    { value: 1, label: '公司制度', tag: 'danger' },
    { value: 2, label: '放假通知', tag: 'success' },
    { value: 3, label: '人事公告', tag: '' },
    { value: 4, label: '活动通知', tag: 'warning' },
    { value: 5, label: '其他', tag: 'info' }
  ],
  /** 公告状态:1草稿 2已发布 3已下架 */
  noticeStatus: [
    { value: 1, label: '草稿', tag: 'info' },
    { value: 2, label: '已发布', tag: 'success' },
    { value: 3, label: '已下架', tag: '' }
  ],
  /** 待办类型:1待审批 2合同到期 3转正提醒 4绩效评分 5培训报名 6其他 */
  todoType: [
    { value: 1, label: '待审批', tag: 'danger' },
    { value: 2, label: '合同到期', tag: 'warning' },
    { value: 3, label: '转正提醒', tag: '' },
    { value: 4, label: '绩效评分', tag: 'warning' },
    { value: 5, label: '培训报名', tag: 'info' },
    { value: 6, label: '其他', tag: 'info' }
  ],
  /** 优先级:1低 2中 3高 */
  priority: [
    { value: 1, label: '低', tag: 'info' },
    { value: 2, label: '中', tag: '' },
    { value: 3, label: '高', tag: 'danger' }
  ],
  /** 业务类型:1请假 2加班 3出差 4员工异动 5离职 6招聘需求 7录用 8调薪 (approval_record.biz_type) */
  bizType: [
    { value: 1, label: '请假' },
    { value: 2, label: '加班' },
    { value: 3, label: '出差' },
    { value: 4, label: '员工异动' },
    { value: 5, label: '离职' },
    { value: 6, label: '招聘需求' },
    { value: 7, label: '录用' },
    { value: 8, label: '调薪' }
  ],
  /** 险种类型:1养老 2医疗 3失业 4工伤 5生育 6住房公积金 */
  socialType: [
    { value: 1, label: '养老保险' },
    { value: 2, label: '医疗保险' },
    { value: 3, label: '失业保险' },
    { value: 4, label: '工伤保险' },
    { value: 5, label: '生育保险' },
    { value: 6, label: '住房公积金' }
  ],
  /** 数据范围:1全部 2本部门 3本部门及下级 4仅本人 5自定义 (sys_role.data_scope) */
  dataScope: [
    { value: 1, label: '全部数据' },
    { value: 2, label: '本部门' },
    { value: 3, label: '本部门及下级' },
    { value: 4, label: '仅本人' },
    { value: 5, label: '自定义' }
  ],
  /** 登录状态:1成功 0失败 */
  loginStatus: [
    { value: 1, label: '成功', tag: 'success' },
    { value: 0, label: '失败', tag: 'danger' }
  ],
  /** 操作类型:1新增 2修改 3删除 4查询 5导出 6导入 7其他 */
  operType: [
    { value: 1, label: '新增', tag: 'success' },
    { value: 2, label: '修改', tag: '' },
    { value: 3, label: '删除', tag: 'danger' },
    { value: 4, label: '查询', tag: 'info' },
    { value: 5, label: '导出', tag: 'warning' },
    { value: 6, label: '导入', tag: 'warning' },
    { value: 7, label: '其他', tag: 'info' }
  ],
  /** 账号状态:1正常 0停用 2锁定 (sys_user.status) */
  userStatus: [
    { value: 1, label: '正常', tag: 'success' },
    { value: 0, label: '停用', tag: 'danger' },
    { value: 2, label: '锁定', tag: 'warning' }
  ],
  /** 菜单类型:1目录 2菜单 3按钮 */
  menuType: [
    { value: 1, label: '目录', tag: 'warning' },
    { value: 2, label: '菜单', tag: '' },
    { value: 3, label: '按钮', tag: 'info' }
  ],
  /** 简历来源:1官网 2招聘网站 3内部推荐 4猎头 5校园招聘 6其他 */
  candidateSource: [
    { value: 1, label: '官网' },
    { value: 2, label: '招聘网站' },
    { value: 3, label: '内部推荐' },
    { value: 4, label: '猎头' },
    { value: 5, label: '校园招聘' },
    { value: 6, label: '其他' }
  ]
}

/** 取字典项数组 */
export function getDict(type) {
  return DICT[type] || []
}

/** 取枚举值显示文案 */
export function dictLabel(type, value) {
  const hit = (DICT[type] || []).find((d) => d.value === value)
  return hit ? hit.label : (value ?? '-')
}

/** 取枚举值标签色（用于 el-tag type） */
export function dictTag(type, value) {
  const hit = (DICT[type] || []).find((d) => d.value === value)
  return hit?.tag || ''
}
