// TTS 音频处理工具
// 将 arraybuffer 写入本地文件并播放

function playAudioBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/tts_${Date.now()}.wav`;

    fs.writeFile({
      filePath,
      data: buffer,
      encoding: 'binary',
      success() {
        const audio = wx.createInnerAudioContext();
        audio.src = filePath;
        audio.onEnded(() => {
          audio.destroy();
          // 清理临时文件
          try { fs.unlinkSync(filePath); } catch {}
        });
        audio.onError((err) => {
          audio.destroy();
          try { fs.unlinkSync(filePath); } catch {}
          reject(err);
        });
        audio.play();
        resolve(audio);
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

// 内置音色列表
const TTS_VOICES = [
  { name: '冰糖', desc: '甜美女声' },
  { name: '茉莉', desc: '温柔女声' },
  { name: '苏打', desc: '活泼女声' },
  { name: '白桦', desc: '沉稳男声' },
  { name: 'Mia', desc: 'EN female' },
  { name: 'Chloe', desc: 'EN female' },
  { name: 'Milo', desc: 'EN male' },
  { name: 'Dean', desc: 'EN male' },
];

module.exports = { playAudioBuffer, TTS_VOICES };
