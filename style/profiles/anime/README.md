# Anime Style Profiles

这里保存 Anime Renderer 的可版本化风格参数，而不是把风格写死在 Shader 中。

第一阶段 Profile 应至少允许控制：

- ShadowSteps
- ShadowThreshold
- ShadowColor
- OutlineWidth
- OutlineColor
- Saturation
- Contrast
- HighlightStyle
- FaceShadowStyle
- HairHighlightStyle
- EnvironmentContrast
- Bloom
- Exposure

候选预设：

```text
TVAnime_Day
TVAnime_Night
AnimeMovie_Sunset
AnimeIndoorWarm
SoftAnime
```

长期目标：允许根据一组动画参考图辅助生成 Profile，但最终产物必须是确定、可审计、可版本化的数据。
