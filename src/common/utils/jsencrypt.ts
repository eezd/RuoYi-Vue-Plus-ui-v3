// 密钥对生成：http://web.chacuo.net/netrsakeypair
import JSEncrypt from "jsencrypt"

const publicKey = import.meta.env.VITE_APP_RSA_PUBLIC_KEY
// 前端私钥是透明的，仅保留兼容旧调用；不建议依赖前端解密敏感数据。
const privateKey = import.meta.env.VITE_APP_RSA_PRIVATE_KEY

// RSA 公钥加密
export function encrypt(txt: string): string | false {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)
  return encryptor.encrypt(txt)
}

// RSA 私钥解密
export function decrypt(txt: string): string | false {
  const encryptor = new JSEncrypt()
  encryptor.setPrivateKey(privateKey)
  return encryptor.decrypt(txt)
}
