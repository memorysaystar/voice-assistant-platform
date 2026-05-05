const { ttsApi } = require('../../utils/api');
const { playAudioBuffer } = require('../../utils/audio');

Page({
  data: {
    prompt: '',
    text: '',
    loading: false,
    audioSrc: null,
    playing: false,
    audioCtx: null,
  },

  onUnload() {
    if (this.data.audioCtx) this.data.audioCtx.destroy();
  },

  onPromptInput(e) { this.setData({ prompt: e.detail.value }); },
  onTextInput(e) { this.setData({ text: e.detail.value }); },

  async onDesign() {
    const { prompt, text } = this.data;
    if (!prompt.trim() || !text.trim()) return;

    this.setData({ loading: true });
    try {
      const res = await ttsApi.design(prompt.trim(), text.trim());
      const audio = await playAudioBuffer(res.data);
      this.setData({ audioCtx: audio, playing: true });
      audio.onEnded(() => this.setData({ playing: false }));
      audio.onPause(() => this.setData({ playing: false }));
      audio.onPlay(() => this.setData({ playing: true }));
    } catch (err) {
      wx.showToast({ title: err.message || '设计失败', icon: 'none' });
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
