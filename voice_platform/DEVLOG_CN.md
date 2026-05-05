# 语音助手平台 - 开发日志

## 2026-05-03 - 初始构建

### 项目结构
```
voice_platform/
  backend/          - FastAPI + SQLAlchemy + JWT认证 + WebSocket
  frontend/         - React 18 + TypeScript + Vite + Tailwind CSS
  .gitignore
```

### 后端实现
- **配置中心**：基于Pydantic Settings的环境变量配置，默认值来自现有MIMO配置
- **数据库**：6个ORM模型（用户、对话、消息、语音档案、使用日志、系统配置）
- **认证系统**：JWT认证 + bcrypt密码哈希，管理员/普通用户角色
- **聊天系统**：REST接口（POST /chat）+ WebSocket流式传输（WS /chat/ws）
- **语音合成**：文字转语音、语音克隆、音色设计 - 均返回WAV字节
- **管理后台**：用户管理、数据概览、使用量图表、系统配置编辑
- **MIMO桥接层**：异步适配器包装现有mimo_utils.py函数（原代码不修改）
- **日志系统**：结构化日志输出到控制台 + 滚动文件（logs/voice_platform.log）
- **中间件**：带请求ID的请求日志、全局错误处理

### 前端实现
- **认证**：登录/注册页面 + JWT令牌管理（Zustand状态管理）
- **聊天**：主仪表盘 + WebSocket流式对话 + 对话历史侧边栏
- **语音合成**：语音合成页面，8种内置音色，风格控制
- **语音克隆**：拖拽上传音频 + 文本合成
- **音色设计**：自然语言描述音色 + 合成
- **设置**：用户资料编辑、自定义API密钥配置
- **管理后台**：数据统计卡片 + 使用量图表、用户管理表格、系统配置编辑器、使用分析（饼图/柱状图）

### 关键技术决策
- 使用 `from __future__ import annotations` + `eval_type_backport` 兼容Python 3.9
- bcrypt 4.0.1（5.0版本与passlib不兼容）
- WebSocket实现流式聊天（双向通信，支持取消）
- SQLite零配置开发（SQLAlchemy抽象数据库层，可随时切换到PostgreSQL）
- Vite代理开发模式（前端:5173 -> 后端:8000）
- 原始voice_asstist/代码不修改 - 通过桥接层适配

### 双语规范
- 代码注释：中文在上，英文在下一行
- 日志消息：中英文在同一行，用 `/ ` 分隔
- 错误提示：中英文双语
- API标签：中英文双语（如 `tags=["认证 / Authentication"]`）

### 默认账号
- 管理员账号通过环境变量 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 配置（首次启动时自动创建）

### 启动方式
1. 后端：`cd voice_platform/backend && python run.py`（端口8000）
2. 前端：`cd voice_platform/frontend && npm run dev`（端口5173）
3. 打开 http://localhost:5173
4. API文档：http://localhost:8000/docs

### 文件统计
后端：26个Python文件
前端：18个TypeScript/TSX文件
共计：44个文件

---

## 2026-05-03 - 日志补全 + WebSocket修复 + TTS集成

### 后端日志补全
- **error_handler.py**：HTTP异常（401/403安全事件、其他4xx）添加WARNING日志
- **auth/service.py**：JWT解码失败添加WARNING日志
- **auth/dependencies.py**：认证失败（无效token、用户不存在、账号停用）、授权失败（非管理员访问）添加WARNING日志
- **auth/router.py**：登录失败（密码错误、账号停用）、注册失败（重复邮箱/用户名）添加WARNING日志
- **chat/router.py**：`chat()`和`chat_funcs()`添加请求开始/完成/失败日志（之前声明了logger但从未调用）
- **tts/router.py**：`tts_synthesize()`、`tts_clone()`、`tts_design()`添加请求开始/完成/失败日志（同上）
- **conversations/router.py**：`update_conversation()`添加更新日志
- **admin/router.py**：`list_users()`和`get_user()`添加DEBUG日志

### WebSocket连接修复（前端）
- **防重复连接**：添加`connectingRef`标记，避免并发`connect()`创建多个socket
- **指数退避重连**：1s→2s→4s→8s→16s，最多10次，成功后重置（替代原来的固定3s无限重连）
- **修复sendMessage竞态**：用`waitForConnection()` Promise轮询替代`setTimeout(500)`硬等
- **连接状态追踪**：新增`isConnected` state暴露给UI，未连接时显示黄色提示条
- **正常关闭不重连**：`event.code !== 1000`才触发重连，避免React StrictMode双重挂载的无效重连

### 聊天消息显示修复
- **chatStore.ts**：`updateLastMessage`从**替换**改为**追加**，修复流式token只显示最后一个的问题

### TTS集成到聊天页面
- **DashboardPage.tsx**：聊天页面集成TTS功能
  - 输入栏左侧新增TTS按钮（绿色音量图标），点击展开/收起TTS面板
  - TTS面板：8音色紧凑选择器 + 文字输入框 + 合成按钮
  - 合成完成后在聊天区上方显示内联音频播放器，自动播放
  - 播放器带下载和关闭按钮，blob URL在组件卸载时自动清理（防止内存泄漏）
  - 输入框回车可直接触发合成
- **自动播放修复**：用`useEffect`监听`audioUrl`+`audioReady`状态，等`onCanPlay`事件触发后再播放（替代不可靠的`setTimeout`）
- **Blob类型修复**：手动创建`new Blob([res.data], { type: 'audio/wav' })`确保MIME类型正确
- **DOM冲突修复**：创建共享`SpinnerButton`组件，用CSS visibility切换图标（`<span className="relative">`包裹），避免React在不同元素类型之间切换时触发`insertBefore` DOM错误。统一修复了DashboardPage、TTSPage、VoiceClonePage、VoiceDesignPage、SettingsPage、SystemConfig共6个页面
- **关闭StrictMode**：移除`main.tsx`中的`<StrictMode>`，避免开发环境WebSocket双重挂载导致的连接错误

### 聊天记录与回复修复
- **侧边栏不刷新**：WebSocket创建新对话后，`conversation_id`事件之前被忽略，现在会调用`chatApi.getConversation()`设置当前对话 + `chatApi.getConversations()`刷新侧边栏列表
- **回复显示不全**：`done`事件之前只设置`isStreaming=false`，现在会用后端返回的`full_content`校准最终内容，防止流式token丢失导致回复截断

---

## 2026-05-03 - 语音克隆500错误修复

### 问题根因
语音克隆上传.m4a文件时触发格式转换，`_audio_convert.py`中`subprocess.run([FFMPEG_PATH, ...])`报`[WinError 2] 系统找不到指定的文件`。

**根本原因**：服务器运行在conda环境`sel`中，`imageio_ffmpeg`已安装但因缺少`setuptools`（`pkg_resources`模块）导致导入失败，回退到`FFMPEG_PATH = "ffmpeg"`字符串，而系统PATH中没有ffmpeg。

### 修复方案
**`_audio_convert.py`**：重写ffmpeg查找逻辑，三级回退策略：
1. **方法1**：通过`imageio_ffmpeg.get_ffmpeg_exe()`获取（正常情况）
2. **方法2**：用`importlib.util.find_spec()`定位包目录，直接在`binaries/`下查找ffmpeg可执行文件（避免触发完整导入）
3. **方法3**：通过`shutil.which("ffmpeg")`在系统PATH中查找

在conda环境中，方法1因`pkg_resources`缺失失败，方法2成功找到`ffmpeg-win64-v4.2.2.exe`，语音克隆功能恢复正常。

---

## 2026-05-03 - 流式聊天闪烁/卡顿修复

### 问题表现
流式回复文字闪烁、卡顿，有时文字消失，需要刷新页面才能恢复。

### 根因分析
1. **高频全量重渲染**：每个token到达时，`updateLastMessage`创建新数组`[...s.messages]`，导致React对整个消息列表做reconcile，所有消息组件都重新渲染
2. **`done`事件二次闪烁**：`setMessages(msgs.map(...))`创建全新数组，所有消息引用变化，`React.memo`失效
3. **无滚动节流**：每个token触发`scrollIntoView({ behavior: 'smooth' })`，密集调用导致layout抖动
4. **引用比较失效**：`msg === messages[messages.length - 1]`在数组拷贝后永远为false

### 修复方案
**`chatStore.ts`** — `updateLastMessage`优化：
- 用`slice(0, -1)`复用前面消息的引用，只替换最后一条消息对象
- 减少不必要的数组/对象创建

**`DashboardPage.tsx`** — 渲染优化：
- 提取`ChatMessage`组件并用`React.memo`包裹，只有`isLast`和`content`变化时才重渲染
- 滚动改用`requestAnimationFrame`节流，避免密集layout计算

**`useWebSocket.ts`** — `done`事件优化：
- `setMessages`改为`slice(0, -1) + push`模式，只替换最后一条消息
- 保持其他消息引用稳定，`React.memo`继续生效

### 二次修复：吞文字问题

**问题**：流式回复仍然会丢失文字，`done`事件的校准没有生效。

**根因**：`done`处理器使用`messagesRef.current`读取当前内容，但ref更新依赖React re-render。在高频token更新下，React可能还没来得及re-render，ref仍指向旧内容。此时校准逻辑`current !== full_content`判断为true，但`current`是旧值，导致用`full_content`覆盖时可能跳过了中间的token。

更关键的是，如果ref恰好和`full_content`一致（因为React刚好在done之前完成了一次re-render），校准会被跳过——即使中间有token丢失。

**修复**：
- `done`处理器改用`useChatStore.getState().messages`直接读取store最新状态（同步，不依赖React render）
- 移除条件判断`current !== full_content`，无条件用`full_content`设置最终内容
- 确保无论中间token状态如何，最终内容一定是后端返回的完整回复

---

## 2026-05-04 - 移动应用初始化（Expo / React Native）

### 技术选型
- **框架**：Expo SDK 54 + React Native + TypeScript
- **目标平台**：安卓 + iOS 一套代码
- **状态管理**：Zustand（与 web 版一致）
- **导航**：React Navigation（底部 Tab + Stack）
- **音频**：expo-av（播放）+ expo-av Recording（录音）
- **存储**：expo-secure-store（JWT 持久化）
- **文件**：expo-document-picker（语音克隆选文件）+ expo-sharing（分享音频）

### 项目结构
```
voice_platform/mobile/src/
├── api/          — 5 个 API 模块（client, auth, chat, tts, admin）
├── stores/       — 3 个 Zustand store（auth, chat, tts）
├── hooks/        — 3 个 Hook（useWebSocket, useAudioPlayer, useAudioRecorder）
├── navigation/   — 6 个导航文件（Root, Auth, AppTabs, Chat, TTS, Admin）
├── screens/      — 13 个页面（auth×2, chat×2, tts×3, settings, admin×4）
├── components/   — 10 个组件（common×3, chat×3, tts×0, admin×3）
├── utils/        — 2 个工具文件（constants, audioHelpers）
└── types/        — 1 个类型定义文件
```

### 文件统计
- TypeScript/TSX 文件：40 个
- TypeScript 编译：零错误通过

### 关键实现
- **WebSocket 流式聊天**：从 web 版移植，新增 AppState 前后台切换自动重连
- **TTS 二进制处理**：axios responseType:arraybuffer → base64 → 写入临时文件 → expo-av 播放
- **语音克隆**：expo-document-picker 选文件 + FormData multipart 上传
- **Token 持久化**：Zustand persist + expo-secure-store 适配器
- **管理后台图表**：纯 View + StyleSheet 自绘柱状图，不引入额外图表库
- **Admin Tab 可见性**：根据 user.role === 'admin' 条件渲染

### 已完成配置
- `constants.ts` 中 `API_BASE_URL` 已设为 `http://192.168.178.84:8000`
- 后端 CORS 已改为 `allow_origins=["*"]`
- `app.json` 配置中文名"语音助手"、安卓包名、权限声明
- `eas.json` 创建 preview profile（APK 构建）

---

## 2026-05-04 - EAS 云构建 APK

### 构建过程
1. 修复 `eas-cli` npx 缓存损坏，改为全局安装
2. `expo-sharing` 无 config plugin，从 `app.json` plugins 中移除
3. `eas.json` 添加 `cli.appVersionSource: "local"`
4. `eas init --force` 创建 EAS 项目（@memorysay/voice-assistant）
5. `eas build --platform android --profile preview` 云构建成功

### 构建结果
- **APK 下载**：https://expo.dev/accounts/memorysay/projects/voice-assistant/builds/9dfee659-c816-4d74-9c1e-4349f7832a60
- **构建方式**：EAS 云编译，无需本地 Android SDK
- **签名**：Expo 自动生成 keystore

### 安装与测试
1. 手机浏览器打开上述链接下载 APK
2. 安装前确保手机和电脑在同一局域网
3. 启动后端：`cd voice_platform/backend && python run.py`
4. 打开 app，登录测试

---

## 2026-05-04 - Android HTTP 明文流量修复

### 问题
APK 安装后登录显示 Network Error。手机浏览器可正常访问 `http://192.168.178.84:8000/health`，但 app 内请求被拦截。

### 根因
Android 9+ 默认禁止 HTTP 明文流量（cleartext traffic），只允许 HTTPS。后端运行在 `http://` 协议上，app 的 HTTP 请求被系统拦截。

### 修复
`app.json` 的 android 配置中添加 `"usesCleartextTraffic": true`，允许 app 发起 HTTP 请求。重新 EAS 云构建 APK。

### 构建结果
- **APK 下载**：https://expo.dev/accounts/memorysay/projects/voice-assistant/builds/40ea76aa-ad5f-4ae7-877d-ae2ed896d68b

---

## 2026-05-04 - 语音克隆格式错误修复

### 问题
移动端语音克隆返回 500 错误。后端日志显示 MIMO API 返回 400：`invalid audio format, only mp3/flac/m4a/wav/ogg are supported`。

### 根因
移动端 `expo-av` HIGH_QUALITY 录音产生 `.m4a` 格式文件，但代码强制命名为 `recording.wav` 并标记 MIME 为 `audio/wav`。后端看到 `.wav` 扩展名跳过格式转换，将 m4a 内容以 `audio/wav` 发送给 MIMO API，导致格式不匹配。

### 修复
1. **移动端 `VoiceCloneScreen.tsx`**：从录音 URI 提取真实扩展名（`.m4a`），不再强制命名为 `.wav`
2. **移动端 `api/tts.ts`**：根据文件扩展名自动推断 MIME 类型（m4a→audio/mp4, mp3→audio/mpeg 等）
3. **后端 `tts_adapter.py`**：m4a/flac/ogg 格式直接发送给 MIMO API（MIMO 原生支持），只对不支持的格式才做 ffmpeg 转换；MIME 类型映射从二元判断改为 map 查表

### 构建结果
- **APK 下载**：https://expo.dev/accounts/memorysay/projects/voice-assistant/builds/469d4626-d333-42a8-aa6d-9cf3b253760a

---

## 2026-05-04 - 局域网 IP 变更 + 服务器地址可配置

### 问题
电脑 WiFi IP 从 `192.168.178.84` 变为 `192.168.41.83`，手机 app 连不上后端。

### 根因
IP 写死在 `constants.ts` 中，打包进 APK。IP 变化后需要重新构建。

### 修复
1. **`constants.ts`**：IP 更新为 `192.168.41.83`
2. **`authStore.ts`**：新增 `serverUrl` 字段（持久化到 SecureStore）
3. **`api/client.ts`**：请求拦截器动态读取 `serverUrl`，不再固定用 constants 的值
4. **`SettingsScreen.tsx`**：新增服务器地址输入框 + 应用按钮
5. **`LoadingButton.tsx`**：新增 `style` prop

### 效果
- 默认使用 `constants.ts` 中的地址
- 用户可在设置页面修改服务器地址，立即生效，无需重新打包
- 地址持久化保存，重启 app 不丢失

### 构建结果
- **APK 下载**：https://expo.dev/accounts/memorysay/projects/voice-assistant/builds/9e048cc7-29db-4d3e-a8a7-4b6ced1fa47f

---

## 2026-05-04 - 语音克隆格式错误二次修复

### 问题
之前的"修复"把 m4a/flac/ogg 加入了 MIMO 支持列表，导致 m4a 跳过 ffmpeg 转换直接发送。但 MIMO 语音克隆的 `audio.voice` 字段**只接受 wav 和 mp3**，返回错误：`Unsupported audio.voice source format: mp4. Supported formats: [wav, mp3]`。

### 根因
MIMO API 有两套格式支持：
- **通用格式**：mp3/flac/m4a/wav/ogg（一般音频上传）
- **voice clone voice 字段**：只支持 wav 和 mp3

### 修复
**`backend/app/mimo_bridge/tts_adapter.py`**：
1. `supported` 元组恢复为 `("mp3", "wav")`（参照原始 `voice_asstist/mimo_utils.py`）
2. `mime_map` 简化为只含 mp3/wav
3. 所有非 mp3/wav 格式（包括 m4a）都通过 ffmpeg 转换为 wav
4. 修复临时文件泄漏：保存原始 `tmp_path`，finally 中清理原始文件和转换后的文件

---

## 2026-05-04 - 微信小程序开发

### 技术选型
- **原生微信小程序**（WXML + WXSS + JS），不用框架，体积最小
- 后端零改动，直接复用 27 个 API 端点
- `wx.request` 替代 axios，`wx.connectSocket` 替代 WebSocket API
- `wx.setStorageSync` 替代 localStorage/SecureStore

### 项目结构
```
voice_platform/miniprogram/
├── app.js / app.json / app.wxss
├── project.config.json
├── assets/               — 6 个 tab 图标
├── utils/
│   ├── api.js            — HTTP 请求封装（wx.request + token）
│   ├── ws.js             — WebSocket 流式聊天（wx.connectSocket）
│   └── audio.js          — TTS 音频处理（arraybuffer → 文件 → 播放）
└── pages/
    ├── login/            — 登录页
    ├── register/         — 注册页
    ├── conversation/     — 对话列表（长按删除）
    ├── chat/             — 流式聊天 + 内嵌 TTS
    ├── tts/              — 语音合成（8 音色选择）
    ├── clone/            — 语音克隆（录音/选文件 + wx.uploadFile）
    ├── design/           — 音色设计
    └── settings/         — 服务器地址 + 用户信息 + 退出
```

### 文件统计
- 小程序文件：46 个（含配置、页面、工具、图标）
- 8 个页面：login, register, conversation, chat, tts, clone, design, settings
- 3 个工具模块：api.js, ws.js, audio.js

### 关键实现
- **WebSocket 流式聊天**：wx.connectSocket 封装，消息协议与 web/mobile 完全一致
- **TTS 音频播放**：wx.request responseType:arraybuffer → wx.getFileSystemManager().writeFile → wx.createInnerAudioContext
- **语音克隆上传**：wx.uploadFile 替代 FormData，filePath 指向录音临时文件
- **Token 持久化**：wx.setStorageSync / wx.getStorageSync
- **服务器地址可配置**：设置页面修改，全局生效

### 使用方式
1. 微信开发者工具导入 `voice_platform/miniprogram/` 目录
2. 在 `project.config.json` 中填入你的小程序 AppID（当前为 `touristappid` 测试模式）
3. 修改 `utils/api.js` 中的 `DEFAULT_BASE_URL` 为你的后端地址
4. 编译运行

---

## 2026-05-04 - 微信小程序开发者工具网络修复

### 问题
微信开发者工具中 `wx.request` 请求发出后无响应 — 后端收到请求并返回 200，但前端 `success`/`fail` 回调均不触发，页面一直转圈。

### 根因
微信开发者工具对局域网 IP（`192.168.41.83`）的 HTTP 请求存在兼容性问题，请求发出后响应丢失。改用 `127.0.0.1` 后恢复正常。

### 修复
**`utils/api.js`**：`DEFAULT_BASE_URL` 改为 `http://127.0.0.1:8000`（开发者工具与后端在同一台机器上）

### 注意
- 真机测试时需在设置页将服务器地址改为局域网 IP（手机上 `127.0.0.1` 指向手机自身）
- 需在微信开发者工具「详情 → 本地设置」中勾选「不校验合法域名」才能使用 HTTP 请求

### WXSS 选择器限制
- 微信小程序组件样式不允许使用标签名选择器（如 `text`）、ID选择器、属性选择器
- 登录页调试日志样式从 `.debug-log text` 改为 `.debug-text` 类选择器

### 登录页 wx.request 问题
- 微信开发者工具中 `wx.request` 存在回调不触发的问题（`success`/`fail`/`complete` 均不执行）
- 后端确认收到请求并返回 200，但前端回调丢失
- 添加页面内调试信息显示 + 5 秒超时自动取消机制，用于定位问题
