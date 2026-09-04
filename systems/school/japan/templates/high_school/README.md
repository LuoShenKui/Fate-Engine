# Default Japanese High School Template

这是 Japanese School System 第一阶段的普通高中参数模板。

它不是“全日本高中都这样”，只是 Fate Engine 快速生成现代日本校园世界的默认起点。

## Default Shape

School 包含 Grade 1、Grade 2、Grade 3、Homeroom Classes、Teaching Staff、Student Guidance、Student Council、Clubs、Library、Nurse Office、Gym、Grounds、Special Classrooms 和 Event Calendar。

## Default Calendar Strategy

- 学年：4 月到次年 3 月
- 默认三学期
- 国家节假日由 Japan Calendar Provider 注入
- 周六日默认无普通课程
- 暑假、寒假、春假由 School Profile 配置
- 学园祭、体育祭、修学旅行只设置候选窗口，不设置全国固定日期

## Default Daily Strategy

普通工作日：

Arrival
→ Morning Homeroom
→ Periods 1-4
→ Lunch
→ Periods 5-6
→ Cleaning / Homeroom
→ Club / Student Council / Free Time
→ Leave School

学校包可以覆盖成 7 节课、周六课、晚间补课或特殊私立学校结构。

## Default Annual Flow

April：新学年、入学式、Orientation、健康诊断、社团招新。

Spring / Early Summer：正常课程、家长与公开活动、考试、安全训练。

Summer：终业式、暑假、社团合宿与比赛。

Autumn：新学期、体育或文化活动、学校配置的修学旅行、考试。

Winter：终业式、寒假。

January-March：最后学期、考试、毕业、升年级、春假。

最终具体日期必须由 World Year + School Profile 解析。
