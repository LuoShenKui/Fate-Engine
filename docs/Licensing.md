# Fate Engine Licensing

> 本文说明 Fate Engine 仓库中不同类型内容的许可证边界。若具体文件、目录或第三方声明另有明确许可证，以更具体的声明为准。

## 1. Code — MPL-2.0

Fate Engine 自有源代码默认采用 **Mozilla Public License 2.0 (MPL-2.0)**。

商业使用允许。**使用 Fate Engine 开发和发行的游戏、应用或其他 Larger Work 可以保持闭源；开发者不需要仅因为使用 Fate Engine 就公开自己的游戏或应用源码。**

如果你修改了 **Fate Engine 自身**受 MPL-2.0 覆盖的源代码文件，并对外分发这些修改后的 Covered Software，则这些受 MPL 覆盖的修改源代码仍需按照 MPL-2.0 提供。独立的游戏代码、游戏逻辑或其他未成为 MPL Covered Software 的独立文件，并不会因为与 Fate Engine 一起组成 Larger Work 就自动变成 MPL-2.0。

> Commercial use is allowed. Games and applications built with Fate Engine do not need to be open sourced. Modifications to MPL-covered Fate Engine source files that are distributed must remain available under MPL-2.0.

完整许可证文本见仓库根目录 `LICENSE`。

## 2. Documentation — CC BY 4.0

Fate Engine 项目自有文档默认采用 **Creative Commons Attribution 4.0 International (CC BY 4.0)**，除非具体文件另有说明。

你可以复制、修改和再发布这些文档，包括商业用途，但需要按照 CC BY 4.0 的要求进行署名。

代码片段若构成 Fate Engine 源代码的一部分，则仍按对应代码许可证处理；文档中的第三方引用内容不因本声明而改变其原有版权状态。

## 3. Sample Assets — CC0 / CC BY 4.0

Fate Engine 自有的示例资产应在资产自身的 metadata、manifest 或同目录 LICENSE 文件中明确标注为：

- **CC0 1.0**；或
- **CC BY 4.0**。

示例资产包括但不限于模型、贴图、动画、音频、图标和演示用内容。

**没有明确资产许可证标记的文件，不应仅因为位于 Fate Engine 仓库中就被推定为 CC0 或 CC BY 4.0。**

## 4. Third-party Assets — Their Respective Licenses

第三方资产、第三方代码和第三方数据继续遵循其各自许可证、版权和使用条款。

Fate Engine 的 MPL-2.0、CC BY 4.0 或 CC0 声明不会覆盖或重新授权第三方内容。

第三方内容应尽量记录：

- author / owner
- source
- license
- commercial_use
- redistribution
- derivatives
- attribution_required
- version / acquisition date（需要时）

## 5. World Asset Library / Marketplace

未来 Fate Engine World Asset Library 与 Marketplace **不强制所有资产采用同一种许可证**。

资产作者可以根据平台允许的许可类型和商业规则选择免费或付费分发。每个 Marketplace Asset 必须携带自己的许可证和使用权限信息。

建议的最小许可字段：

```text
asset_id
author
source
license
commercial_use
redistribution
derivatives
attribution_required
marketplace_resale
exclusive
```

这允许生态中同时存在：

- CC0 免费资产；
- CC BY 资产；
- 开源资产；
- 免费但禁止二次销售的资产；
- 商业付费资产；
- 允许商业游戏使用但禁止重新分发源资产的资产；
- 经合法授权的第三方 IP 资产。

Marketplace 的平台服务费、交易抽成、退款、作者分成和商业条款属于未来单独的 Marketplace Terms，不由 MPL-2.0 决定。

## 6. Trademark

MPL-2.0 不自动授予 Fate Engine 名称、Logo 或其他商标权利。

未来如果项目公开形成正式品牌，应增加独立的 `TRADEMARK.md`，规定 Fork、兼容实现以及 “Powered by Fate Engine” 等名称和标识的使用方式。

## 7. Summary

```text
Code:
MPL-2.0

Documentation:
CC BY 4.0

Sample assets:
CC0 / CC BY 4.0 (as explicitly marked)

Third-party assets:
Their respective licenses

Marketplace assets:
Per-asset license and commercial terms
```

> 许可证涉及实际法律权利与义务。项目进入正式商业运营、Marketplace 上线或接受外部大规模贡献前，应由专业法律顾问复核贡献协议、商标政策、Marketplace Terms 和第三方资产合规流程。