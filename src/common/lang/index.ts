// 自定义国际化配置
import { createI18n } from "vue-i18n"
import { LanguageEnum } from "../enums/LanguageEnum"
import { getLanguage } from "../utils/cache/local-storage"
import en_US from "./en_US"
import zh_CN from "./zh_CN"

const i18n = createI18n({
  legacy: false, // 必须设为 false，启用 Composition API 模式
  locale: getLanguage(),
  fallbackLocale: "en_US",
  messages: {
    [LanguageEnum.zh_CN]: zh_CN,
    [LanguageEnum.en_US]: en_US
  },
  // 开发环境显示警告
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV
})

export default i18n

export type LanguageType = typeof zh_CN
