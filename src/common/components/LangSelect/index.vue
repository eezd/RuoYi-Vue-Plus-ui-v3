<script setup lang="ts">
import { LanguageEnum } from "@@/enums/LanguageEnum"
import { useI18n } from "vue-i18n"
import { useAppStore } from "@/pinia/stores/app"

const appStore = useAppStore()
const { locale } = useI18n()

const message: Record<LanguageEnum, string> = {
  [LanguageEnum.zh_CN]: "切换语言成功！",
  [LanguageEnum.en_US]: "Switch Language Successful!"
}

function isLanguage(lang: string | number | object): lang is LanguageEnum {
  return Object.values(LanguageEnum).includes(lang as LanguageEnum)
}

function handleLanguageChange(lang: string | number | object) {
  if (!isLanguage(lang)) return

  locale.value = lang
  appStore.changeLanguage(lang)
  ElMessage.success(message[lang])
}
</script>

<template>
  <el-dropdown trigger="click" @command="handleLanguageChange">
    <div class="lang-select--style">
      <SvgIcon name="language" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item :disabled="appStore.language === LanguageEnum.zh_CN" :command="LanguageEnum.zh_CN">
          中文
        </el-dropdown-item>
        <el-dropdown-item :disabled="appStore.language === LanguageEnum.en_US" :command="LanguageEnum.en_US">
          English
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.lang-select--style {
  font-size: 18px;
  line-height: 50px;
}
</style>
