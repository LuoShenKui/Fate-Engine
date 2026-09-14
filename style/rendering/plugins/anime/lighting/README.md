# Anime Lighting

目标不是直接使用物理光照结果，而是建立动画式光照解释层。

```text
Physical / Scene Light
        ↓
Anime Light Interpreter
        ↓
Stylized Light Result
```

第一阶段能力：

- Light / Shadow 阈值；
- 亮面、阴影面、强调面分层；
- Character 与 Environment 分离控制；
- 夜间、逆光、室内灯下的角色脸部保护；
- 美术覆盖物理结果的接口。
