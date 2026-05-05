const { ttsApi } = require('../../utils/api');
const { playAudioBuffer, TTS_VOICES } = require('../../utils/audio');

Page({
  data: {
    voices: TTS_VOICES,
    selectedVoice: '冰糖',
    text: '',
    loading: false,
    audioSrc: null,
    playing: false,
    audioCtx: null,
  },

  onUnload() {
    if (this.data.audioCtx) {
      this.data.audioCtx.destroy();
    }
  },

  onSelectVoice(e) {
    this.setData({ selectedVoice: e.currentTarget.dataset.name });
  },

  onTextInput(e) {
    this.setData({ text: e.detail.value });
  },

  async onSynthesize() {
    const text = this.data.text.trim();
    if (!text) return;

    this.setData({ loading: true });
    try {
      const res = await ttsApi.synthesize(text, this.data.selectedVoice);
      const audio = await playAudioBuffer(res.data);
      this.setData({ audioCtx: audio, playing: true });
      audio.onEnded(() => this.setData({ playing: false }));
      audio.onPause(() => this.setData({ playing: false }));
      audio.onPlay(() => this.setData({ playing: true }));
    } catch (err) {
      wx.showToast({ title: '合成失败', icon: 'none' });
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

  onStop() {
    if (this.data.audioCtx) {
      this.data.audioCtx.stop();
      this.setData({ playing: false });
    }
  },
});
