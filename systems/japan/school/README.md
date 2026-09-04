# Japanese School System

Japanese School System 是 Fate Engine 的日本校园社会系统模板。

第一阶段以日本高中为基准，因为它在现代日本题材和二次元作品中复用率最高；后续再扩展初中、小学、大学等变体。

核心目标不是“做几个校园事件”，而是让学校根据日期、时间、学期、课程、人员关系、规章、社团、节日和突发事件持续运行。

## 核心循环

World Date / Time
→ Japan National Holidays
→ Local / Board Calendar
→ School Academic Calendar
→ Term / Vacation / School Day
→ Daily Timetable
→ Classes / Homeroom / Club / Event
→ Attendance + Learning + Relationships + Records
→ Character / School State Changes
→ Next Day

学校不是剧情触发器，而是一个长期运转的制度。

## 时间基础

日本学校学年默认从 4 月开始，到次年 3 月结束。

模板必须支持：

- 三学期制与两学期制
- 周末
- 日本法定节假日
- 地方教育委员会规定的休业日
- 学校自行安排的活动日
- 暑假、寒假、春假
- 补课日
- 临时停课
- 台风、暴雪、地震、传染病等临时事件
- 考试周
- 学园祭准备日
- 体育祭准备日
- 修学旅行
- 毕业相关日程

活动日期不能作为全国统一常量。学园祭、体育祭、修学旅行、期中考试等必须由 School Calendar 配置，并允许世界运行时修改。

## 子系统

- calendar：学年、学期、节假日、休假、校历、每日时间解析
- academics：课程、课堂、教师、出勤、作业、考试、成绩和真实学习进度
- homeroom：班级、班主任、值日、班会、座位、班级委员会
- lifecycle：入学、新生欢迎、转学、分班、升年级、毕业
- events：仪式、文化活动、体育活动、安全活动、旅行、公开课
- clubs：社团创建、招新、成员、顾问教师、预算、活动、比赛、退部
- governance：校长、教务、学生指导、生徒会、教师权限和审批
- discipline：迟到、旷课、作弊、打架、违禁品、处分和申诉
- templates/high_school：默认高中参数模板

## 学校不是孤岛

School 必须与 Character、Family、Transport、Economy、Hospital、Police、Justice、Fate 和 Causality 互通。

示例：

学生早上发烧
→ 家长决定请假
→ 缺席数学测验
→ 成绩变化
→ 班主任记录
→ 补考安排
→ 下午无法参加社团
→ 社团比赛阵容变化
→ 队友关系变化

## 事件必须产生制度后果

“转学生登场”不能只是播放动画：

转入手续完成
→ 学籍建立
→ 分配年级与班级
→ 班主任收到通知
→ 座位重新安排
→ Homeroom 介绍
→ 同学形成第一印象
→ 社团开始招募
→ 新角色获得正式 School Identity

“学园祭”也不能只是换一张地图：

学校批准活动
→ 生徒会制定规则
→ 班级提交企划
→ 预算审批
→ 分工
→ 准备期占用课后时间
→ 人际冲突与合作
→ 正式举办
→ 收支、评价、处分、关系结果

## 第一阶段范围

第一版先完成一个可长期运行的普通高中：

- 3 个年级
- 每年级若干班
- 教师与班主任
- 标准工作日课表
- 三学期校历
- 入学、转学、毕业
- 真正课堂
- 期中、期末考试
- 文化祭
- 体育祭
- 修学旅行
- 社团
- 生徒会
- 基础纪律
- 健康诊断与避难训练
- 国家节假日与长假
- 临时停课与补课

第一版不追求模拟日本全国所有学校，而是建立一个可参数化的普通日本高中模板。
