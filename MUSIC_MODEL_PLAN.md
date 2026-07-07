# Diary Records 音乐生成方案

## 当前结论

现阶段建议采用“两层方案”：

1. **比赛演示与快速迭代：优先使用 API。**  
   前端把日记内容整理成结构化音乐 prompt，调用可用的 music/song/audio generation API。API 成功时播放真实音频；失败时回退到本地 WebAudio demo，保证演示不断链。

2. **后续产品化或离线演示：再部署开源模型。**  
   开源音乐模型通常需要 GPU、模型权重、Python 推理服务和音频文件存储，不建议直接塞进前端。更合理的方式是部署一个本地或云端 `/generate-song` 服务，前端只提交 prompt，后端生成音频后返回 `audioUrl`。

## 候选模型方向

### 1. MusicGen / AudioCraft

Meta 的 MusicGen 来自 AudioCraft，论文中说明它可以根据文本描述或旋律条件生成高质量 mono/stereo 音乐。优点是生态成熟、资料多、适合做 text-to-music demo；缺点是中文歌词演唱和完整歌曲结构不是它最强的方向。

适合本项目的用途：

- 根据日记生成 15-30 秒氛围音乐。
- 生成分享页背景音乐。
- 做“唱片 demo”而不是完整歌曲。

参考：MusicGen 论文与代码入口：https://github.com/facebookresearch/audiocraft

### 2. Stable Audio Open

Stable Audio Open 是开放权重 text-to-audio 模型，强调高质量 stereo sound synthesis。它更适合音效、环境声、短音乐片段，不一定适合带歌词的完整中文歌。

适合本项目的用途：

- 给粒子页面生成氛围声。
- 根据日记心情生成 ambient texture。
- 给“唱片播放界面”增加声景。

参考：Stable Audio Open 论文：https://arxiv.org/abs/2407.14358

### 3. ACE-Step / ACE-Step 1.5

ACE-Step 系列更接近“完整歌曲生成”方向。公开论文宣称支持更强的歌曲结构、歌词对齐、编辑和多语言控制；ACE-Step 1.5 还强调消费级硬件可运行和低显存需求。它更符合 Diary Records “把日记写成一首歌”的长期目标。

适合本项目的用途：

- 根据日记生成完整私人歌曲。
- 做歌词、风格、情绪和人声控制。
- 后续支持用户个人风格 LoRA。

参考：

- ACE-Step：https://ace-step.github.io/
- ACE-Step 1.5：https://ace-step.github.io/ace-step-v1.5.github.io/

## 推荐架构

```text
前端 Diary Records
  -> 生成结构化 song prompt
  -> POST /api/generate-song
  -> 后端选择 API 或本地模型
  -> 返回 { title, lyric, chorus, bpm, key, style, prompt, audioUrl }
  -> 前端播放 audioUrl，并驱动唱片/波形动效
```

## 当前前端已支持的返回格式

```json
{
  "title": "给喜欢的生活投票",
  "lyric": "主歌歌词",
  "chorus": "副歌歌词",
  "style": "lo-fi bedroom pop / soft vocal / warm guitar",
  "bpm": 92,
  "key": "G major",
  "prompt": "Full English prompt for music generation",
  "audioUrl": "https://example.com/song.mp3"
}
```

如果没有 `audioUrl`，前端会使用 WebAudio 合成一个 demo 旋律，并展示唱片旋转和波形反馈。

## 建议 prompt 模板

```text
Create a short private diary song in Chinese.
Mood: {mood}
Scene: {visual_scene}
Diary: {diary_text}
Keywords: {keywords}
Style: minimal but emotional, refined, not commercial jingle, not AI-like.
Vocal: intimate female vocal, gentle breath, natural Mandarin pronunciation.
Arrangement: {style_reference}, soft drums, subtle bass, cinematic texture.
Length: 45-90 seconds.
Output: title, lyric, chorus, bpm, key, style, audio.
```

## 为什么暂不直接部署

- 音乐模型权重大，下载和运行时间不可控。
- 需要确认本机 GPU、显存、CUDA/PyTorch 版本。
- 比赛展示更重视稳定链路，API + 本地 fallback 更稳。
- 真正部署应放在后端服务中，不应让浏览器直接承担模型推理。

下一步如果要部署，建议先选 ACE-Step 或 AudioCraft，并单独建立 `music-service/`，不要把模型环境混进前端项目。
