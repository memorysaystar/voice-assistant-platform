// ArrayBuffer 转 Base64 / ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa 在 React Native 中可用 / btoa is available in RN
  return global.btoa(binary);
}
