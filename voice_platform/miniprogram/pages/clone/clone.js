const { ttsApi } = require('../../utils/api');
const { playAudioBuffer } = require('../../utils/audio');

const recorderManager = wx.getRecorderManager();

Page({
  data: {
    isRecording: false,
    filePath: null,
    fileName: null,
    text: '',
    loading: false,
    audioSrc: null,
    playing: false,
    audioCtx: null,
  },

  onLoad() {
    recorderManager.onStop((res) => {
      if (res.tempFilePath) {
        this.setData({
          filePath: res.tempFilePath,
          fileName: '录音.wav',
        });
      }
    });
    recorderManager.onError((err) => {
      wx.showToast({ title: '录音失败', icon: 'none' });
      this.setData({ isRecording: false });
    });
  },

  onUnload() {
    if (this.data.audioCtx) this.data.audioCtx.destroy();
  },

  onChooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['mp3', 'wav', 'm4a', 'flac', 'ogg'],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({
          filePath: file.path,
          fileName: file.name,
        });
      },
    });
  },

  onToggleRecord() {
    if (this.data.isRecording) {
      recorderManager.stop();
      this.setData({ isRecording: false });
    } else {
      recorderManager.start({
        format: 'wav',
        sampleRate: 16000,
        numberOfChannels: 1,
      });
      this.setData({ isRecording: true, filePath: null, fileName: null });
    }
  },

  onTextInput(e) {
    this.setData({ text: e.detail.value });
  },

  async onClone() {
    const { filePath, text } = this.data;
    if (!filePath || !text.trim()) {
      wx.showToast({ title: '请选择音频并输入文字', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await ttsApi.clone(filePath, text.trim());
      // uploadFile 返回的 res.data 是字符串（base64），需要处理
      // 对于 arraybuffer 响应，wx.uploadFile 不支持 responseType
      // 所以后端返回的是 JSON 包装的 base64 或直接 wav
      // 这里假设后端返回的是二进制（需要后端配合返回 base64 或使用 wx.request）
      wx.showToast({ title: '克隆成功', icon: 'success' });

      // 尝试播放（如果返回的是文件路径或 arraybuffer）
      if (res.data) {
        try {
          const audio = await playAudioBuffer(res.data);
          this.setData({ audioCtx: audio, playing: true });
          audio.onEnded(() => this.setData({ playing: false }));
        } catch {}
      }
    } catch (err) {
      wx.showToast({ title: err.message || '克隆失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onPlay() {
    const audio = this.data.audioCtx;
    if (!audio) return;
    if (this.data.playing) {
      audio.pause();
    } else {
      audio.play();
    }
  },
});
