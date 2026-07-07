# Diary Records｜日记唱片

> **把一天的照片、情绪、对话和音乐，压制成一张可以回看、可以播放、可以分享的私人唱片。**

Diary Records｜日记唱片 是一个面向手机 AI 助手与手机系统 AI 体验设计的可运行 AIGC 应用原型。它不只是“帮用户写日记”，而是把照片、陪伴式对话、情绪理解、粒子影像、唱片视觉和私人音乐生成融合在一起，让每一天都成为一张有画面、有情绪、有旋律的日记唱片。

当前仓库主要用于网页端/PWA 复现与作品展示。Android 工程、ACE-Step 模型仓库、node_modules、dist 构建产物和本地密钥不会上传到 GitHub，请按本文档在本地重新安装和生成。

## 作品宣传海报

<p align="center">
  <img src="./宣传海报/宣传海报1.png" alt="Diary Records 宣传海报 1" width="100%" />
</p>

<p align="center">
  <img src="./宣传海报/宣传海报2.png" alt="Diary Records 宣传海报 2" width="100%" />
</p>

---

## 作品一句话

**一张照片，一段对话，一首歌。**  
Diary Records 将用户的生活片段整理成可听、可看、可分享的个人记忆唱片。

## 项目定位

当年轻人的生活越来越多地发生在手机里，AI 助手能不能不只是回答问题，而是帮助用户保存生活、理解情绪、创造表达？

Diary Records 尝试给出一种新的答案：

- 它不是传统的文字日记工具，而是一个 **个人记忆生成器**。
- 它不是普通 AI 聊天窗口，而是一个能围绕当天生活继续追问、总结和创作的 **AI 陪伴入口**。
- 它不是单纯的音乐生成工具，而是把音乐绑定到某一天、某张照片和某段情绪上的 **私人唱片系统**。

产品面向 18-35 岁高频手机用户，适用于学习复盘、工作记录、旅行回忆、宠物日常、情绪整理、社交分享和特殊纪念日记录等场景。

## 核心体验

```text
上传一张照片
      ↓
和 AI 轻松聊几句
      ↓
AI 提炼标题、摘要、关键词和心情
      ↓
照片变成粒子影像或唱片视觉
      ↓
根据日记生成歌词、曲风和私人短歌
      ↓
形成一张可以回看、播放、分享的日记唱片
```

## 已实现功能

| 模块 | 已实现能力 | 说明 |
| --- | --- | --- |
| 开始界面 | 流体星轨背景、日记唱片符号、进入引导 | 形成正式产品的第一视觉记忆点 |
| 登录与游客模式 | Supabase 登录/注册、游客体验、本地用户隔离 | 未配置 Supabase 时也能完整演示 |
| 日记创建 | 日期、时间段、标题、一句话、心情标签、图片上传 | 支持快速创建当天或某个时段的记录 |
| AI 陪伴对话 | 文字对话、浏览器语音输入、情绪化追问 | 帮助用户把零散感受讲完整 |
| 日记结构化 | 自动生成标题、摘要、关键词、心情、正文 | 降低写作门槛，让内容更清晰 |
| 粒子影像 | Three.js/WebGL 图像粒子、深度映射、鼠标/触控交互 | 将普通照片转化为有空间感的记忆影像 |
| 手势实验 | MediaPipe HandLandmarker 接入基础 | 为手机端手势控制和粒子扰动预留入口 |
| 唱片视觉 | 粒子视图/唱片视图切换、播放动效 | 建立“压制日记唱片”的产品隐喻 |
| 音乐生成 | 歌曲标题、歌词、副歌、曲风、BPM、调性、prompt | 可对接 ACE-Step 等音乐生成服务 |
| 上传音乐 | 用户可上传本地音频作为日记配乐 | 当模型生成过慢或结果不满意时稳定兜底 |
| 本地音频演示 | WebAudio demo fallback | 音乐模型不可用时也能完整展示流程 |
| Memory 翻阅 | 交错式唱片翻阅、打开详情、删除日记、重新压制 | 让旧日记成为可回访的长期记忆节点 |
| Music 页面 | 唱片播放、歌词展示、歌曲信息、上传/移除配乐 | 形成完整的私人音乐库体验 |
| 分享导出 | 生成封面图、复制文案、系统分享 | 适配朋友圈、小红书、Instagram、视频号等分享场景 |
| 手机端适配 | 响应式布局、移动端安全宽度、APK/WebView 演示优化 | 适合手机端展示和云真机调试 |
| 手机生态联动设想 | 相册、日历、位置、备忘录、运动、音乐等线索模拟 | 展示未来作为系统级 AI 记忆插件的潜力 |

## 技术实现

| 技术点 | 说明 |
| --- | --- |
| HTML / CSS / JavaScript | 保持轻量结构，便于比赛演示和静态部署 |
| Three.js | 用于图像粒子、空间深度和高性能视觉效果 |
| MediaPipe Tasks Vision | 预留手势追踪能力，用于后续手机端交互 |
| Web Speech API | 支持浏览器语音输入演示链路 |
| WebAudio | 在音乐模型不可用时生成本地 demo 旋律 |
| Supabase Auth / Database | 支持登录、注册和日记云同步 |
| IndexedDB | 保存用户上传的本地音频文件 |
| OpenAI-compatible API | 支持接入 Gemini、Vivo、代理网关等多种模型服务 |
| ACE-Step API Proxy | 本地服务代理音乐生成模型，避免前端直接跨域请求 |
| Capacitor | 本地保留 Android 打包能力，适配 APK 演示 |

## 快速运行

安装依赖：

```powershell
npm install
```

启动本地服务：

```powershell
npm run dev
```

访问：

```text
http://127.0.0.1:55173/index.html
```

也可以直接打开 `index.html`，但直接打开文件时无法读取 `.env`，因此 Supabase 登录同步、ACE-Step 代理等能力会受限。推荐始终使用 `npm run dev`。

## 环境变量

复制 `.env.example` 为 `.env`，再填入自己的配置：

```text
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
ACE_STEP_BASE_URL=http://127.0.0.1:8001
ACE_STEP_API_KEY=
```

说明：

- `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 用于登录注册和日记云同步。
- 只能填写 Supabase anon public key，不要填写 service role key。
- `ACE_STEP_BASE_URL` 是本地 ACE-Step API 服务地址。
- 如果 ACE-Step 服务没有设置鉴权，`ACE_STEP_API_KEY` 留空即可。
- `.env` 包含本地配置和密钥，不应提交到 GitHub。

## Supabase 配置

1. 在 Supabase 创建项目。
2. 开启 Email/Password Auth。
3. 在 Supabase SQL Editor 中执行 `SUPABASE_SCHEMA.sql`。

该 SQL 会创建 `diary_entries` 表，并开启 Row Level Security。每个登录用户只能读写自己的日记。

如果 Supabase 未配置，项目仍可用游客模式运行。游客模式数据保存在当前浏览器本地。

## 数据保存位置

- 游客日记：浏览器 `localStorage`，键名为 `diary-records.guest.entries`。
- 登录用户日记：浏览器 `localStorage` + Supabase `diary_entries` 表。
- 用户上传音乐：浏览器 IndexedDB，库名为 `diary-records-audio`。

登录后可通过 Supabase 同步日记文本与结构化内容。音乐文件目前优先保存在本地 IndexedDB，如需跨设备同步，可后续接入 Supabase Storage。

## AI API 配置

点击页面右上角设置按钮，可配置 OpenAI-compatible 接口。

| 配置项 | 说明 |
| --- | --- |
| Base URL | 例如 `https://example.com/v1` |
| API Key | 你的模型服务密钥 |
| Chat / Vision Model | 用于日记对话、摘要、关键词提取和图片理解 |
| Music Model | 用于歌词、曲风和音乐 prompt 生成 |
| Music Service | ACE-Step 代理地址，默认 `/api/ace-step` |

如果外部模型暂不可用，原型会自动回退到本地 demo 逻辑，保证主要演示流程可以继续完成。

## 音乐生成

当前音乐有三种来源：

1. **ACE-Step 真实生成**  
   前端通过本地 `server.cjs` 代理访问 `/api/ace-step`，再转发到 `.env` 中的 `ACE_STEP_BASE_URL`。

2. **用户上传音乐**  
   在 Music 页面可以上传本地音频，作为该篇日记的配乐。上传音频会优先于 AI 生成音频播放。

3. **本地 WebAudio 草稿旋律**  
   当 ACE-Step 没有返回音频时，应用会自动生成一段本地草稿旋律，保证唱片播放动效可演示。

如果本机显存较小，ACE-Step 首次生成可能非常慢。4GB 显存设备可能会进入 CPU VAE decode，生成一首歌可能需要很久。比赛演示时建议准备一段上传音乐作为稳定兜底。

## 网页部署

网页端可以部署为静态站点：

```powershell
npm run prepare:apk
```

然后上传 `dist/` 目录到：

- Netlify
- Vercel
- Cloudflare Pages
- GitHub Pages

注意：部署后的网页无法访问你电脑本地的 ACE-Step 服务，除非把音乐生成服务部署到公网服务器。网页端仍可使用上传音乐、日记创建、粒子效果、唱片展示和 Supabase 同步。

## APK 说明

本仓库默认不上传 `android/` 工程和 APK 构建产物，以保持 GitHub 仓库轻量。若在本机保留了 Android 工程，可运行：

```powershell
npm run prepare:apk
npm run apk:debug
```

APK 输出位置：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

如果是全新 clone 后需要重新生成 Android 工程，可先安装 Capacitor 依赖，再执行：

```powershell
npx cap add android
npm run cap:sync
```

Capacitor Android 当前建议使用 JDK 17。

## 推荐演示流程

1. 进入开始界面，点击进入日记唱片。
2. 在 Garden 页上传一张照片或加载样片。
3. 输入一句当天的感受，选择心情标签。
4. 与 AI 进行几轮陪伴式对话。
5. 生成标题、摘要、关键词和心情。
6. 切换粒子视图和唱片视图，查看“日记唱片”效果。
7. 进入 Music 页面，查看歌词、曲风、BPM、调性和播放效果。
8. 如果音乐模型生成较慢，上传一段本地音乐作为配乐。
9. 进入 Memory 页面，横向翻阅历史日记。
10. 打开某篇旧日记，查看详情、关键词、历史对话和歌曲信息。

## 检查命令

语法检查：

```powershell
npm run check
```

重新生成静态产物：

```powershell
npm run prepare:apk
```

## 仓库提交范围

本仓库建议包含：

```text
index.html
app.js
styles.css
server.cjs
package.json
package-lock.json
capacitor.config.json
manifest.webmanifest
sw.js
icon.svg
scripts/
assets/
宣传海报/
SUPABASE_SCHEMA.sql
PROJECT_REPORT.md
PRODUCT_INTRO.md
MUSIC_MODEL_PLAN.md
GEMINI_MODEL_NOTES.md
README.md
.env.example
```

不上传：

```text
node_modules/
dist/
android/
.ace-step-docs/
.agents/
.env
api_test.py
vivo_asr.py
vivo_llm.py
cat.jpg
水晶.jpg
实习.jpg
qa-*.png
```

## 相关文档

- `PROJECT_REPORT.md`：完整产品汇报，包含作品设计理念、前景评估、原型设计、创新点说明。
- `PRODUCT_INTRO.md`：面向展示与答辩的产品介绍。
- `MUSIC_MODEL_PLAN.md`：音乐生成模型选型、ACE-Step 接入与后续扩展方案。
- `GEMINI_MODEL_NOTES.md`：Gemini 多模态与 TTS 模型使用说明。

## 后续规划

- 接入 Supabase Storage，让用户上传音乐跨设备同步。
- 将 ACE-Step 部署到云 GPU，避免本地显卡性能限制。
- 增加手机系统级授权模拟：相册、日历、备忘录、定位、运动、输入法片段等。
- 扩展为手机插件、快应用或系统 AI 助手能力，让用户授权后自动整理生活片段。
- 增加分享模板，导出适合小红书、Instagram、朋友圈的动态日记卡片。

## 团队信息

**团队名称：** WeAreTheFuture  
**作品名称：** Diary Records｜日记唱片  
**参赛方向：** 2026 年中国高校计算机大赛 AIGC 创新赛
