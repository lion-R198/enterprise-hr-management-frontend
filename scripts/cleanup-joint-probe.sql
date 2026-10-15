-- 清理前后端联调探针数据（统一 TCP 前缀）
--
-- 用途：联调测试台（dev/joint-test.js）会在真实库里创建少量探针记录以正向验证写接口。
--       本脚本按前缀把它们逐表清除，保证演示数据回到基线。
--
-- 顺序：自底向上（被外键引用的从属表先清），最后短暂关闭外键检查删除父行，
--       因为 employee 被 20+ 个 ON DELETE RESTRICT 外键引用。
--
-- 用法：mysql -uroot -p123456 -D enterprise_hr < scripts/cleanup-joint-probe.sql

-- ① 薪资探针月份（核算用例会把全员记录写入该月，须按整月整段清除）
DELETE FROM salary_item WHERE salary_record_id IN (
  SELECT id FROM (SELECT id FROM salary_record WHERE salary_year = 2026 AND salary_month = 1) t
);
DELETE FROM salary_record WHERE salary_year = 2026 AND salary_month = 1;

-- ② 审批留痕：按 BizType 逐维度定位（同一 biz_id 数值在不同业务表里是不同实体，不能只按数值匹配）
DELETE FROM approval_record WHERE
     (biz_type = 1 AND biz_id IN (SELECT id FROM (SELECT id FROM leave_request      WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e1)) a1))
  OR (biz_type = 2 AND biz_id IN (SELECT id FROM (SELECT id FROM overtime_request    WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e2)) a2))
  OR (biz_type = 3 AND biz_id IN (SELECT id FROM (SELECT id FROM business_trip       WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e3)) a3))
  OR (biz_type = 4 AND biz_id IN (SELECT id FROM (SELECT id FROM employee_change     WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e4)) a4))
  OR (approval_opinion LIKE '%TCP%');

-- ③ 待办：审批流生成的待办接收人是真实主管（不是探针员工），
--    因此必须「先按被审批单据反查 biz 关联」再删，否则会漏掉
DELETE FROM todo_task WHERE
     (biz_type = 1 AND biz_id IN (SELECT id FROM (SELECT id FROM leave_request    WHERE reason  LIKE '%TCP%') t1))
  OR (biz_type = 2 AND biz_id IN (SELECT id FROM (SELECT id FROM overtime_request  WHERE reason  LIKE '%TCP%') t2))
  OR (biz_type = 3 AND biz_id IN (SELECT id FROM (SELECT id FROM business_trip     WHERE purpose LIKE '%TCP%') t3));
-- 再按标题前缀兜底（含探针员工姓名的待办标题里会带 TCP）
DELETE FROM todo_task WHERE task_title LIKE '%TCP%'
   OR receiver_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);

-- ④ 探针员工的从属行
DELETE FROM leave_balance        WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM attendance_record    WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM attendance_month     WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM employee_schedule    WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM employee_salary      WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM insurance_record     WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM employee_change      WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM employee_contract    WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM employee_attachment  WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM notice_read          WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM leave_request        WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM overtime_request     WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM business_trip        WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM performance_interview WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM performance_record   WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM performance_indicator WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM training_enroll      WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM training_record      WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);
DELETE FROM trainer              WHERE employee_id IN (SELECT id FROM (SELECT id FROM employee WHERE name LIKE 'TCP%') e);

-- ⑤ 招聘探针（需求 → 候选人 → 面试 → Offer）
DELETE FROM interview_record WHERE candidate_id IN (SELECT id FROM (SELECT id FROM candidate WHERE name LIKE 'TCP%') c);
DELETE FROM offer_record     WHERE candidate_id IN (SELECT id FROM (SELECT id FROM candidate WHERE name LIKE 'TCP%') c);
DELETE FROM candidate        WHERE name LIKE 'TCP%';
DELETE FROM job_posting      WHERE recruit_request_id IN (SELECT id FROM (SELECT id FROM recruit_request WHERE position_name LIKE 'TCP%') r);
DELETE FROM recruit_request  WHERE position_name LIKE 'TCP%';

-- ⑥ 绩效 / 培训 / 公告 / 薪资标准探针
DELETE FROM performance_interview WHERE record_id IN (
  SELECT id FROM (SELECT id FROM performance_record WHERE plan_id IN
    (SELECT id FROM (SELECT id FROM performance_plan WHERE plan_name LIKE 'TCP%') p)) pr
);
DELETE FROM performance_record    WHERE plan_id IN (SELECT id FROM (SELECT id FROM performance_plan WHERE plan_name LIKE 'TCP%') p);
DELETE FROM performance_indicator WHERE plan_id IN (SELECT id FROM (SELECT id FROM performance_plan WHERE plan_name LIKE 'TCP%') p);
DELETE FROM performance_plan      WHERE plan_name LIKE 'TCP%';
DELETE FROM training_enroll       WHERE plan_id IN (SELECT id FROM (SELECT id FROM training_plan WHERE plan_name LIKE 'TCP%') p);
DELETE FROM training_record       WHERE plan_id IN (SELECT id FROM (SELECT id FROM training_plan WHERE plan_name LIKE 'TCP%') p);
DELETE FROM training_plan         WHERE plan_name LIKE 'TCP%';
DELETE FROM notice                WHERE title LIKE 'TCP%';
DELETE FROM salary_standard       WHERE standard_code LIKE 'TCP%';

-- ⑦ 探针账号与角色
DELETE FROM sys_user_role WHERE user_id IN (SELECT id FROM (SELECT id FROM sys_user WHERE username LIKE 'tcp_%') u);
DELETE FROM sys_user      WHERE username LIKE 'tcp_%';
DELETE FROM sys_user_role WHERE role_id IN (SELECT id FROM (SELECT id FROM sys_role WHERE role_code LIKE 'ROLE_TCP%') r);
DELETE FROM sys_role      WHERE role_code LIKE 'ROLE_TCP%';

-- ⑦.5 兜底：按业务标记清理「由演示员工发起」的探针单据
--      这类单据的 employee_id 是演示员工，不会被上面的"探针员工"条件命中；
--      若不清理，重复运行联调测试时会被 BR-04-01（时间重叠）等规则挡下。
DELETE FROM leave_request    WHERE reason  LIKE '%TCP%';
DELETE FROM overtime_request WHERE reason  LIKE '%TCP%';
DELETE FROM business_trip    WHERE purpose LIKE '%TCP%';

-- ⑧ 父行硬删（仅针对已按前缀筛出的探针行）
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM employee WHERE name LIKE 'TCP%' OR emp_no LIKE 'TCP%';
DELETE FROM position WHERE position_code LIKE 'TCP%';
DELETE FROM dept     WHERE dept_code LIKE 'TCP%';
SET FOREIGN_KEY_CHECKS = 1;

-- ⑨ 残留核查（全部应为 0）
SELECT 'dept' t, COUNT(*) c FROM dept WHERE dept_code LIKE 'TCP%'
UNION ALL SELECT 'position', COUNT(*) FROM position WHERE position_code LIKE 'TCP%'
UNION ALL SELECT 'employee', COUNT(*) FROM employee WHERE name LIKE 'TCP%'
UNION ALL SELECT 'notice', COUNT(*) FROM notice WHERE title LIKE 'TCP%'
UNION ALL SELECT 'training_plan', COUNT(*) FROM training_plan WHERE plan_name LIKE 'TCP%'
UNION ALL SELECT 'performance_plan', COUNT(*) FROM performance_plan WHERE plan_name LIKE 'TCP%'
UNION ALL SELECT 'recruit_request', COUNT(*) FROM recruit_request WHERE position_name LIKE 'TCP%'
UNION ALL SELECT 'candidate', COUNT(*) FROM candidate WHERE name LIKE 'TCP%'
UNION ALL SELECT 'salary_standard', COUNT(*) FROM salary_standard WHERE standard_code LIKE 'TCP%'
UNION ALL SELECT 'salary_record_202601', COUNT(*) FROM salary_record WHERE salary_year = 2026 AND salary_month = 1
UNION ALL SELECT 'sys_user', COUNT(*) FROM sys_user WHERE username LIKE 'tcp_%'
UNION ALL SELECT 'sys_role', COUNT(*) FROM sys_role WHERE role_code LIKE 'ROLE_TCP%'
UNION ALL SELECT 'todo_task', COUNT(*) FROM todo_task WHERE task_title LIKE '%TCP%'
UNION ALL SELECT 'leave_request_probe', COUNT(*) FROM leave_request WHERE reason LIKE '%TCP%'
UNION ALL SELECT 'overtime_request_probe', COUNT(*) FROM overtime_request WHERE reason LIKE '%TCP%'
UNION ALL SELECT 'business_trip_probe', COUNT(*) FROM business_trip WHERE purpose LIKE '%TCP%';

-- ⑩ 演示数据基线（不得少于以下数值）
SELECT 'employee_baseline' t, COUNT(*) c FROM employee WHERE deleted = 0
UNION ALL SELECT 'dept_baseline', COUNT(*) FROM dept WHERE deleted = 0
UNION ALL SELECT 'salary_record_baseline', COUNT(*) FROM salary_record;
