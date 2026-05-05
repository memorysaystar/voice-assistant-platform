# Voice Assistant Platform - Development Log

## 2026-05-03 - Initial Build

### Project Structure
```
voice_platform/
  backend/          - FastAPI + SQLAlchemy + JWT auth + WebSocket
  frontend/         - React 18 + TypeScript + Vite + Tailwind CSS
  .gitignore
```

### Backend Implementation
- **Config**: Pydantic Settings with env-based config, defaults from existing MIMO config
- **Database**: 6 ORM models (User, Conversation, Message, VoiceProfile, UsageLog, SystemConfig)
- **Auth**: JWT-based authentication with bcrypt password hashing, admin/user roles
- **Chat**: REST endpoint (POST /chat) + WebSocket streaming (WS /chat/ws)
- **TTS**: Text-to-speech synthesis, voice cloning, voice design - all return WAV bytes
- **Admin**: User management, analytics overview, usage charts, system config editor
- **MIMO Bridge**: Async adapters wrapping existing mimo_utils.py functions (untouched)
- **Logging**: Structured logging to console + rotating file (logs/voice_platform.log)
- **Middleware**: Request logging with request IDs, global error handlers

### Frontend Implementation
- **Auth**: Login/Register pages with JWT token management (Zustand store)
- **Chat**: Main dashboard with WebSocket streaming, conversation history sidebar
- **TTS**: Voice synthesis page with 8 built-in voices, style control
- **Voice Clone**: Drag-and-drop audio upload + text synthesis
- **Voice Design**: Natural language voice description + synthesis
- **Settings**: User profile, custom API key configuration
- **Admin**: Dashboard with stats cards + usage charts, user management table, system config editor, usage analytics with pie/bar charts

### Key Technical Decisions
- Used `from __future__ import annotations` + `eval_type_backport` for Python 3.9 compatibility
- bcrypt 4.0.1 (5.0 breaks passlib compatibility)
- WebSocket for streaming chat (bidirectional, supports cancellation)
- SQLite for zero-setup development (SQLAlchemy abstracts DB, easy to switch to PostgreSQL)
- Vite proxy for dev (frontend:5173 -> backend:8000)
- Original voice_asstist/ code untouched - bridge layer adapts it

### Bilingual Convention
- Code comments: Chinese primary, English on next line
- Log messages: Chinese + English on same line, separated by `/ `
- Error messages: Bilingual
- API tags: Bilingual (e.g. `tags=["认证 / Authentication"]`)

### Default Credentials
- Admin account is configured via environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD` (created on first startup)

### How to Run
1. Backend: `cd voice_platform/backend && python run.py` (port 8000)
2. Frontend: `cd voice_platform/frontend && npm run dev` (port 5173)
3. Open http://localhost:5173
4. API docs: http://localhost:8000/docs

### Files Created
Backend: 26 Python files
Frontend: 18 TypeScript/TSX files
Total: 44 files

---

## 2026-05-03 - Logging Completion + WebSocket Fix + TTS Integration

### Backend Logging Completion
- **error_handler.py**: Added WARNING logs for HTTP exceptions (401/403 security events, other 4xx)
- **auth/service.py**: Added WARNING log for JWT decode failures
- **auth/dependencies.py**: Added WARNING logs for auth failures (invalid token, user not found, inactive account) and authorization failures (non-admin access)
- **auth/router.py**: Added WARNING logs for login failures (wrong password, deactivated account) and registration failures (duplicate email/username)
- **chat/router.py**: Added start/completion/failure logs for `chat()` and `chat_funcs()` (logger was declared but never called)
- **tts/router.py**: Added start/completion/failure logs for `tts_synthesize()`, `tts_clone()`, `tts_design()` (same issue)
- **conversations/router.py**: Added update log for `update_conversation()`
- **admin/router.py**: Added DEBUG logs for `list_users()` and `get_user()`

### WebSocket Connection Fix (Frontend)
- **Duplicate connection prevention**: Added `connectingRef` flag to prevent concurrent `connect()` from creating multiple sockets
- **Exponential backoff reconnect**: 1s→2s→4s→8s→16s, max 10 attempts, reset on success (replaced fixed 3s infinite loop)
- **sendMessage race condition fix**: Replaced `setTimeout(500)` with `waitForConnection()` Promise polling
- **Connection state tracking**: New `isConnected` state exposed to UI, shows yellow banner when disconnected
- **No reconnect on normal close**: Only reconnect on `event.code !== 1000`, avoids useless reconnects from React StrictMode double-mount

### Chat Message Display Fix
- **chatStore.ts**: `updateLastMessage` changed from **replace** to **append**, fixing streaming tokens showing only the last one

### TTS Integration into Chat Page
- **DashboardPage.tsx**: Integrated TTS functionality directly into the chat page
  - TTS button (green volume icon) next to input bar, toggle TTS panel
  - TTS panel: 8-voice compact selector + text input + synthesize button
  - Inline audio player appears above chat area after synthesis, auto-plays
  - Player has download and close buttons, blob URLs cleaned up on unmount (prevents memory leak)
  - Enter key in TTS input triggers synthesis
- **Auto-play fix**: Use `useEffect` watching `audioUrl` + `audioReady` state, play after `onCanPlay` event (replaces unreliable `setTimeout`)
- **Blob type fix**: Manually create `new Blob([res.data], { type: 'audio/wav' })` to ensure correct MIME type
- **DOM conflict fix**: Created shared `SpinnerButton` component using CSS visibility toggle (wrapped in `<span className="relative">`), avoiding React `insertBefore` DOM error when switching between different element types. Fixed across 6 pages: DashboardPage, TTSPage, VoiceClonePage, VoiceDesignPage, SettingsPage, SystemConfig
- **Disable StrictMode**: Removed `<StrictMode>` from `main.tsx` to prevent WebSocket double-mount connection errors in development

### Chat History & Reply Fixes
- **Sidebar not refreshing**: After WebSocket creates a new conversation, the `conversation_id` event was ignored. Now it calls `chatApi.getConversation()` to set current conversation + `chatApi.getConversations()` to refresh sidebar list
- **Reply truncated**: `done` event previously only set `isStreaming=false`. Now it uses the backend's `full_content` to calibrate final content, preventing token loss during streaming

---

## 2026-05-03 - Voice Clone 500 Error Fix

### Root Cause
Voice clone with .m4a files triggered format conversion. `subprocess.run([FFMPEG_PATH, ...])` in `_audio_convert.py` threw `[WinError 2] The system cannot find the file specified`.

**Root cause**: Server runs in conda env `sel`. `imageio_ffmpeg` is installed but fails to import due to missing `setuptools` (`pkg_resources` module), falling back to `FFMPEG_PATH = "ffmpeg"` string, which isn't in system PATH.

### Fix
**`_audio_convert.py`**: Rewrote ffmpeg lookup with 3-tier fallback:
1. **Method 1**: `imageio_ffmpeg.get_ffmpeg_exe()` (normal case)
2. **Method 2**: `importlib.util.find_spec()` to locate package directory, then search `binaries/` for ffmpeg executable (avoids full import)
3. **Method 3**: `shutil.which("ffmpeg")` to search system PATH

In the conda env, method 1 fails due to missing `pkg_resources`, method 2 successfully finds `ffmpeg-win64-v4.2.2.exe`, restoring voice clone functionality.

---

## 2026-05-03 - Streaming Chat Flicker/Stutter Fix

### Symptoms
Streaming reply text flickers, stutters, sometimes text disappears. Requires page refresh to recover.

### Root Cause
1. **High-frequency full re-renders**: Every token arrival, `updateLastMessage` created a new array via `[...s.messages]`, causing React to reconcile the entire message list and re-render all message components
2. **`done` event double-flash**: `setMessages(msgs.map(...))` created a brand new array, invalidating all message references and defeating `React.memo`
3. **No scroll throttling**: Every token triggered `scrollIntoView({ behavior: 'smooth' })`, causing layout thrashing at high frequency
4. **Stale reference comparison**: `msg === messages[messages.length - 1]` was always false after array copy

### Fix
**`chatStore.ts`** — `updateLastMessage` optimization:
- Use `slice(0, -1)` to reuse preceding message references, only replace the last message object
- Reduce unnecessary array/object allocations

**`DashboardPage.tsx`** — Render optimization:
- Extract `ChatMessage` component wrapped in `React.memo`, only re-renders when `isLast` or `content` changes
- Scroll throttled via `requestAnimationFrame` to avoid dense layout calculations

**`useWebSocket.ts`** — `done` event optimization:
- `setMessages` changed to `slice(0, -1) + push` pattern, only replaces the last message
- Keeps other message references stable so `React.memo` remains effective

### Second Fix: Text Loss Issue

**Problem**: Streaming replies still lose text. The `done` event calibration was not working.

**Root cause**: The `done` handler read current content via `messagesRef.current`, but the ref update depends on React re-render. Under high-frequency token updates, React may not have re-rendered yet, so the ref still points to stale content. The calibration logic `current !== full_content` would either: (a) read stale content and overwrite with `full_content`, potentially skipping intermediate tokens, or (b) if the ref happened to match `full_content` (React rendered just before `done`), skip calibration entirely — even if tokens were lost.

**Fix**:
- `done` handler now reads from `useChatStore.getState().messages` directly (synchronous, no React render dependency)
- Removed conditional check `current !== full_content` — unconditionally sets `full_content` as final content
- Ensures final content is always the complete reply from the backend, regardless of intermediate token state

---

## 2026-05-04 - Mobile App Initialization (Expo / React Native)

### Tech Stack
- **Framework**: Expo SDK 54 + React Native + TypeScript
- **Target**: Android + iOS from single codebase
- **State**: Zustand (consistent with web)
- **Navigation**: React Navigation (bottom tabs + stack)
- **Audio**: expo-av (playback) + expo-av Recording (recording)
- **Storage**: expo-secure-store (JWT persistence)
- **Files**: expo-document-picker (voice clone upload) + expo-sharing (audio sharing)

### Project Structure
```
voice_platform/mobile/src/
├── api/          — 5 API modules (client, auth, chat, tts, admin)
├── stores/       — 3 Zustand stores (auth, chat, tts)
├── hooks/        — 3 hooks (useWebSocket, useAudioPlayer, useAudioRecorder)
├── navigation/   — 6 nav files (Root, Auth, AppTabs, Chat, TTS, Admin)
├── screens/      — 13 screens (auth×2, chat×2, tts×3, settings, admin×4)
├── components/   — 10 components (common×3, chat×3, admin×3)
├── utils/        — 2 utility files (constants, audioHelpers)
└── types/        — 1 type definitions file
```

### File Count
- TypeScript/TSX files: 40
- TypeScript compilation: zero errors

### Key Implementations
- **WebSocket streaming**: Ported from web, added AppState foreground/background reconnect
- **TTS binary handling**: axios responseType:arraybuffer → base64 → temp file → expo-av playback
- **Voice clone**: expo-document-picker + FormData multipart upload
- **Token persistence**: Zustand persist + expo-secure-store adapter
- **Admin charts**: Pure View + StyleSheet bar charts, no chart library dependency
- **Admin tab visibility**: Conditional render based on user.role === 'admin'

### Completed Configuration
- `API_BASE_URL` set to `http://192.168.178.84:8000` in constants.ts
- Backend CORS changed to `allow_origins=["*"]`
- `app.json` configured with Chinese name "语音助手", Android package, permissions
- `eas.json` created with preview profile (APK build)

---

## 2026-05-04 - EAS Cloud APK Build

### Build Process
1. Fixed corrupted eas-cli npx cache, installed globally
2. Removed `expo-sharing` from app.json plugins (no config plugin)
3. Added `cli.appVersionSource: "local"` to eas.json
4. `eas init --force` created EAS project (@memorysay/voice-assistant)
5. `eas build --platform android --profile preview` succeeded

### Build Result
- **APK download**: https://expo.dev/accounts/memorysay/projects/voice-assistant/builds/9dfee659-c816-4d74-9c1e-4349f7832a60
- **Build method**: EAS cloud compilation, no local Android SDK needed
- **Signing**: Expo auto-generated keystore

### Install & Test
1. Open the link on phone browser to download APK
2. Ensure phone and computer on same LAN
3. Start backend: `cd voice_platform/backend && python run.py`
4. Open app and login to test

---

## 2026-05-04 - Android Cleartext Traffic Fix

### Problem
APK installed but login showed Network Error. Phone browser could access `http://192.168.178.84:8000/health` fine, but app requests were blocked.

### Root Cause
Android 9+ blocks HTTP cleartext traffic by default, only allowing HTTPS. Backend runs on `http://`, so app's HTTP requests were intercepted by the system.

### Fix
Added `"usesCleartextTraffic": true` to android config in `app.json`. Rebuilt APK via EAS cloud.

### Build Result
- **APK download**: https://expo.dev/accounts/memorysay/projects/voice-assistant/builds/40ea76aa-ad5f-4ae7-877d-ae2ed896d68b

---

## 2026-05-04 - Voice Clone Format Error Fix

### Problem
Mobile voice clone returned 500 error. Backend log showed MIMO API returned 400: `invalid audio format, only mp3/flac/m4a/wav/ogg are supported`.

### Root Cause
Mobile `expo-av` HIGH_QUALITY recording produces `.m4a` format, but code forced filename to `recording.wav` with MIME type `audio/wav`. Backend saw `.wav` extension and skipped format conversion, sending m4a content as `audio/wav` to MIMO API — format mismatch.

### Fix
1. **Mobile `VoiceCloneScreen.tsx`**: Extract real extension from recording URI (`.m4a`), no longer force `.wav`
2. **Mobile `api/tts.ts`**: Auto-detect MIME type from file extension (m4a→audio/mp4, mp3→audio/mpeg, etc.)
3. **Backend `tts_adapter.py`**: m4a/flac/ogg sent directly to MIMO API (natively supported), only convert unsupported formats; MIME type mapping changed from binary check to map lookup

### Build Result
- **APK download**: https://expo.dev/accounts/memorysay/projects/voice-assistant/builds/469d4626-d333-42a8-aa6d-9cf3b253760a

---

## 2026-05-04 - LAN IP Change + Configurable Server Address

### Problem
Computer WiFi IP changed from `192.168.178.84` to `192.168.41.83`, mobile app couldn't connect to backend.

### Root Cause
IP was hardcoded in `constants.ts`, baked into APK. IP changes require rebuild.

### Fix
1. **`constants.ts`**: IP updated to `192.168.41.83`
2. **`authStore.ts`**: Added `serverUrl` field (persisted to SecureStore)
3. **`api/client.ts`**: Request interceptor reads `serverUrl` dynamically, no longer fixed to constants value
4. **`SettingsScreen.tsx`**: Added server URL input + apply button
5. **`LoadingButton.tsx`**: Added `style` prop

### Result
- Default uses address from `constants.ts`
- User can change server URL in Settings page, takes effect immediately, no rebuild needed
- Address persists across app restarts

### Build Result
- **APK download**: https://expo.dev/accounts/memorysay/projects/voice-assistant/builds/9e048cc7-29db-4d3e-a8a7-4b6ced1fa47f

---

## 2026-05-04 - Voice Clone Format Error (Second Fix)

### Problem
Previous "fix" added m4a/flac/ogg to MIMO supported list, causing m4a to skip ffmpeg conversion. But MIMO voice clone `audio.voice` field **only accepts wav and mp3**, returning: `Unsupported audio.voice source format: mp4. Supported formats: [wav, mp3]`.

### Root Cause
MIMO API has two format sets:
- **General formats**: mp3/flac/m4a/wav/ogg (general audio upload)
- **Voice clone voice field**: only wav and mp3

### Fix
**`backend/app/mimo_bridge/tts_adapter.py`**:
1. `supported` tuple reverted to `("mp3", "wav")` (matching original `voice_asstist/mimo_utils.py`)
2. `mime_map` simplified to mp3/wav only
3. All non-mp3/wav formats (including m4a) converted via ffmpeg to wav
4. Fixed temp file leak: save original `tmp_path`, clean up both original and converted files in finally

---

## 2026-05-04 - WeChat Mini Program Development

### Tech Stack
- **Native WeChat Mini Program** (WXML + WXSS + JS), no framework, minimal size
- Zero backend changes, reuses all 27 API endpoints
- `wx.request` replaces axios, `wx.connectSocket` replaces WebSocket API
- `wx.setStorageSync` replaces localStorage/SecureStore

### Project Structure
```
voice_platform/miniprogram/
├── app.js / app.json / app.wxss
├── project.config.json
├── assets/               — 6 tab icons
├── utils/
│   ├── api.js            — HTTP wrapper (wx.request + token)
│   ├── ws.js             — WebSocket streaming (wx.connectSocket)
│   └── audio.js          — TTS audio (arraybuffer → file → playback)
└── pages/
    ├── login/            — Login page
    ├── register/         — Register page
    ├── conversation/     — Conversation list (long-press delete)
    ├── chat/             — Streaming chat + inline TTS
    ├── tts/              — TTS synthesis (8 voices)
    ├── clone/            — Voice clone (record/file + wx.uploadFile)
    ├── design/           — Voice design
    └── settings/         — Server URL + user info + logout
```

### File Count
- Mini program files: 46 (config, pages, utils, icons)
- 8 pages: login, register, conversation, chat, tts, clone, design, settings
- 3 utility modules: api.js, ws.js, audio.js

### Key Implementations
- **WebSocket streaming**: wx.connectSocket wrapper, same JSON protocol as web/mobile
- **TTS audio playback**: wx.request responseType:arraybuffer → wx.getFileSystemManager().writeFile → wx.createInnerAudioContext
- **Voice clone upload**: wx.uploadFile replaces FormData, filePath points to recording temp file
- **Token persistence**: wx.setStorageSync / wx.getStorageSync
- **Configurable server URL**: Settings page, global effect

### Usage
1. Import `voice_platform/miniprogram/` in WeChat Developer Tools
2. Set your Mini Program AppID in `project.config.json` (currently `touristappid` for testing)
3. Update `DEFAULT_BASE_URL` in `utils/api.js` to your backend address
4. Compile and run

---

## 2026-05-04 - WeChat Developer Tools Network Fix

### Problem
In WeChat Developer Tools, `wx.request` sent the HTTP request (backend received it and returned 200), but neither `success` nor `fail` callbacks fired — page stayed loading forever.

### Root Cause
WeChat Developer Tools has a compatibility issue with HTTP requests to LAN IPs (`192.168.41.83`). Responses are silently dropped. Using `127.0.0.1` resolves the issue.

### Fix
**`utils/api.js`**: `DEFAULT_BASE_URL` changed to `http://127.0.0.1:8000` (developer tools and backend on same machine)

### Notes
- For real device testing, change server URL in Settings page to LAN IP (`127.0.0.1` on phone points to the phone itself)
- Must enable "Do not verify valid domain names" in Developer Tools → Details → Local Settings for HTTP requests to work

### WXSS Selector Limitations
- WeChat Mini Program component styles do not allow tag name selectors (e.g. `text`), ID selectors, or attribute selectors
- Login page debug log style changed from `.debug-log text` to `.debug-text` class selector

### Login Page wx.request Issue
- WeChat Developer Tools has a bug where `wx.request` callbacks (`success`/`fail`/`complete`) never fire
- Backend confirms receiving the request and returning 200, but frontend callbacks are lost
- Added in-page debug info display + 5-second timeout auto-cancel mechanism to diagnose the issue
