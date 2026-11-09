# dsh-token-brain

给 [DeepSeek Harness](https://deepseek.com) 用的上下文与交付技能包。装上后技能目录里多出 4 个技能：省 token、少返工、交付更接近你要的那一版。

插件不改变模型能力，也不承诺省下多少比例的费用。它给的是一套执行动作：读什么、读多少、先问什么、交付写多长。

## 注册的技能

| 技能 | 解决的问题 |
|---|---|
| `token-budget` | 先算 token 花在哪，再决定读什么、写多长；列出绝对不能省的约束与数字 |
| `context-triage` | 大仓库、长会话、日志与网页的取数法：先定位再读片段，状态卡替代旧历史 |
| `intent-brief` | 动手前把「要什么算对」写成八项 brief；缺信息一次问清，不打断就按默认做并说明 |
| `lean-output` | 交付克制：结论在前、不重复、不铺垫；长文先给结构，代码只给片段 |

四个技能互相衔接：`intent-brief` 定标准 → `context-triage` 取数 → `token-budget` 把关 → `lean-output` 交付。

## 安装

1. 克隆本仓库到本地。
2. 在 Harness 里让 agent 用 `plugin_manager`，`action: install_bundle`，`target` 传目录绝对路径。
3. 重启 Harness。

没有配置项。装完直接说需求就会命中对应技能。

## 用法

- 「这个仓库太大，先帮我定位订单校验逻辑，别通读。」
- 「预算有限，这个重构分几步做，每一步读哪些文件。」
- 「需求还没想全，先和我对齐要什么，再一次做完。」
- 「把这次会话压缩成状态卡，后面接着做。」

## 结构

```
dsh-token-brain/
├── index.js            # Host apply()：读取 skills/*.md 并注册
├── cordis.patch.yml    # bundle 补丁
├── skills/*.md         # 4 个技能
├── locale/zh.json      # 显示名与描述
├── locale/en.json
├── icon.svg
├── NOTICE.md
└── LICENSE
```

## 工作方式

Host 激活时列出 `skills/*.md`，解析头部 frontmatter（`name`、`description`、`whenToUse`、`license`），把正文注册为运行时技能。注册都包在 `ctx.effect()` 里，禁用或卸载时依次注销。技能正文只在被调用时进入上下文。

## 自定义

- 删技能：删掉 `skills/<name>.md` 或改名。
- 加技能：新增 `skills/<kebab-case>.md`，frontmatter 同结构。
- 插件行支持 `config.disabled: string[]`，列出的技能不注册。
- 改完重启 Harness。

## 边界

- 不承诺具体省钱比例，不编平台计费规则。
- 省 token 不能牺牲约束、术语、数字、安全边界与验证结果，技能里已列出红线。
- 方法来自公开的 prompt 工程与工程实践总结，示例为自拟。

## 许可

MIT，见 `LICENSE`。来源说明见 `NOTICE.md`。
