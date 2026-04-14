import CryptoJS from "crypto-js"

const RANDOM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const AES_KEY_LENGTH = 32

/**
 * 随机生成 32 位字符串；优先使用浏览器安全随机数，兼容不支持 crypto 的环境。
 */
function generateRandomString() {
  const values = new Uint32Array(AES_KEY_LENGTH)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values)
  } else {
    for (let i = 0; i < values.length; i++) {
      values[i] = Math.floor(Math.random() * RANDOM_CHARS.length)
    }
  }

  return Array.from(values, value => RANDOM_CHARS[value % RANDOM_CHARS.length]).join("")
}

/**
 * 随机生成 AES 密钥。
 */
export function generateAesKey() {
  return CryptoJS.enc.Utf8.parse(generateRandomString())
}

/**
 * 加密 base64。
 */
export function encryptBase64(str: CryptoJS.lib.WordArray) {
  return CryptoJS.enc.Base64.stringify(str)
}

/**
 * 解密 base64。
 */
export function decryptBase64(str: string) {
  return CryptoJS.enc.Base64.parse(str)
}

/**
 * 使用 AES 密钥加密数据。
 * @param message 待加密明文
 * @param aesKey AES 密钥
 */
export function encryptWithAes(message: string, aesKey: CryptoJS.lib.WordArray) {
  const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

/**
 * 使用 AES 密钥解密数据。
 * @param message 待解密密文
 * @param aesKey AES 密钥
 */
export function decryptWithAes(message: string, aesKey: CryptoJS.lib.WordArray) {
  const decrypted = CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}
