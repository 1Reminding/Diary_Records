# Diary Records Gemini Model Notes

## Current model routing

The model names visible in the current API group are useful, but they do not all solve the same job.

- `gemini-3.5-flash`, `gemini-3-flash-preview`, `gemini-3-pro-preview`: best for diary conversation, image understanding, lyric writing, song structure, and music-generation prompts.
- `gemini-2.5-flash-preview-tts`, `gemini-2.5-pro-preview-tts`: text-to-speech models. They are useful for spoken diary playback, voice replies, and podcast-like narration, but they are not text-to-music models.
- Real song audio generation should use a dedicated music model such as `lyria-3-clip-preview` / `lyria-3-pro-preview` when the API group exposes it, or a separate `/generate-song` service backed by ACE-Step, MusicGen, or another music model.

## App defaults

```text
Chat / Vision Model: gemini-3-flash-preview
Music Prompt Model: gemini-3.5-flash
Future Real Audio: lyria-3-clip-preview or dedicated /generate-song service
```

The front end accepts `audioUrl` in the song JSON. If the selected model only returns lyrics and a production prompt, the app keeps the record playable through the local WebAudio demo.
