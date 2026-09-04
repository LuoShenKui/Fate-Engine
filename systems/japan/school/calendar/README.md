# School Calendar & Time

Calendar 是 Japanese School System 的驱动器。

## Calendar Resolution

最终某一天是否上学、发生什么，由多层日历合并：

World Calendar
→ Japan National Holidays
→ Prefecture / Board Rules
→ School Year Rules
→ Term Calendar
→ School Event Calendar
→ Class / Club Calendar
→ Runtime Exception

越靠后的层级优先级越高。

## Academic Year

默认 Academic Year 为 4 月到次年 3 月。

支持三学期制，也支持两学期制。世界逻辑不能依赖“三学期一定存在”。

## Day Types

- NORMAL_SCHOOL_DAY
- SHORT_DAY
- EXAM_DAY
- EVENT_DAY
- CEREMONY_DAY
- CLUB_ONLY_DAY
- MAKEUP_DAY
- WEEKEND
- NATIONAL_HOLIDAY
- SCHOOL_HOLIDAY
- SUMMER_VACATION
- WINTER_VACATION
- SPRING_VACATION
- TEMPORARY_CLOSURE

## Daily Timeline

默认高中模板示例：

- 07:30-08:25 Arrival
- 08:25-08:35 Morning Homeroom
- 08:45-09:35 Period 1
- 09:45-10:35 Period 2
- 10:45-11:35 Period 3
- 11:45-12:35 Period 4
- 12:35-13:15 Lunch
- 13:20-14:10 Period 5
- 14:20-15:10 Period 6
- 15:15-15:30 Cleaning / Homeroom
- 15:30-18:00 Clubs / Student Council / Free Time

这些只是默认参数，不是全国固定时间。

## Annual Event Windows

事件使用“候选窗口 + 学校计划”，而不是写死日期：

- Entrance Ceremony：4 月上旬候选
- Health Check：4 月候选
- Club Recruitment：4 月候选
- Parent Meeting：春季候选
- Midterm / Final：学校配置
- Sports Festival：学校配置
- Culture Festival：学校配置
- School Trip：学校配置
- Graduation：学年末候选

## Holiday Rules

国家节假日由 Japan Calendar Provider 注入，包括固定节日、移动节日、春分秋分、振替休日和夹在两个国民祝日之间形成的休日。

School Calendar 不自己硬编码这些规则。

## Runtime Exceptions

台风、地震、暴雪、传染病、校舍损坏、警察事件和重大 Fate Event 都可以取消、延期、缩短、移动、替换或产生补课，并形成因果记录。
