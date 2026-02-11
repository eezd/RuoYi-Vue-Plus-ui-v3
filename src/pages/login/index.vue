<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { LoginData, LoginRequestData, TenantVO } from "@/common/apis/login/type"
import { getCaptchaApi, getTenantListApi, loginApi } from "@@/apis/login"
import { authRouterUrlApi } from "@@/apis/system/social/auth"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import { Key, Loading, Lock, Picture, User } from "@element-plus/icons-vue"
import LangSelect from "@/common/components/LangSelect/index.vue"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import Owl from "./components/Owl.vue"
import { useFocus } from "./composables/useFocus"

const router = useRouter()

const userStore = useUserStore()

const settingsStore = useSettingsStore()

const { isFocus, handleBlur, handleFocus } = useFocus()

/** 登录表单元素的引用 */
const loginFormRef = useTemplateRef("loginFormRef")

/** 登录按钮 Loading */
const loading = ref(false)

/** 验证码图片 URL */
const codeUrl = ref("")

// 验证码开关
const captchaEnabled = ref(true)
// 租户开关
const tenantEnabled = ref(true)
// 租户列表
const tenantList = ref<TenantVO[]>([])

/** 登录表单数据 */
const loginFormData = ref<LoginRequestData>({
  tenantId: "000000",
  username: "admin",
  password: "admin123",
  code: "",
  uuid: "",
  clientId: import.meta.env.VITE_APP_CLIENT_ID,
  grantType: "password"
})

/** 登录表单校验规则 */
const loginFormRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 4, max: 16, message: "长度在 48 到 16 个字符", trigger: "blur" }
  ],
  code: [
    { required: captchaEnabled.value, message: "请输入验证码", trigger: "blur" }
  ]
}

/** 登录 */
function handleLogin() {
  loginFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    // 勾选了需要记住密码设置在 localStorage 中设置记住用户名和密码
    if (loginFormData.value.rememberMe) {
      localStorage.setItem("tenantId", String(loginFormData.value.tenantId))
      localStorage.setItem("username", String(loginFormData.value.username))
      localStorage.setItem("password", String(loginFormData.value.password))
      localStorage.setItem("rememberMe", String(loginFormData.value.rememberMe))
    } else {
      // 否则移除
      localStorage.removeItem("tenantId")
      localStorage.removeItem("username")
      localStorage.removeItem("password")
      localStorage.removeItem("rememberMe")
    }
    loginApi(loginFormData.value).then(({ data }) => {
      if (data.access_token) {
        userStore.setToken(data.access_token)
        router.push("/index")
      }
    }).catch(() => {
      createCode()
      loginFormData.value.password = ""
    }).finally(() => {
      loading.value = false
    })
  })
}

/**
 * 第三方登录
 * @param type
 */
function doSocialLogin(type: string) {
  authRouterUrlApi(type, localStorage.value.tenantId).then((res: any) => {
    if (res.code === 200) {
      // 获取授权地址跳转
      window.location.href = res.data
    } else {
      ElMessage.error(res.msg)
    }
  })
}

/** 创建验证码 */
function createCode() {
  // 清空已输入的验证码
  loginFormData.value.code = ""
  // 清空验证图片
  codeUrl.value = ""
  // 获取验证码图片
  getCaptchaApi().then((res) => {
    codeUrl.value = `data:image/gif;base64,${res.data.img}`
    captchaEnabled.value = res.data.captchaEnabled
    loginFormData.value.uuid = res.data.uuid
  })
}

function getLoginData() {
  const tenantId = localStorage.getItem("tenantId")
  const username = localStorage.getItem("username")
  const password = localStorage.getItem("password")
  const rememberMe = localStorage.getItem("rememberMe")
  loginFormData.value = {
    tenantId: tenantId === null ? String(loginFormData.value.tenantId) : tenantId,
    username: username === null ? String(loginFormData.value.username) : username,
    password: password === null ? String(loginFormData.value.password) : String(password),
    rememberMe: rememberMe === null ? false : Boolean(rememberMe)
  } as LoginData
}

/**
 * 获取租户列表
 */
async function initTenantList() {
  const { data } = await getTenantListApi(false)
  tenantEnabled.value = data.tenantEnabled === undefined ? true : data.tenantEnabled
  if (tenantEnabled.value) {
    tenantList.value = data.voList
    if (tenantList.value != null && tenantList.value.length !== 0) {
      loginFormData.value.tenantId = tenantList.value[0].tenantId
    }
  }
}

// 初始化验证码
onMounted(() => {
  createCode()
  initTenantList()
  getLoginData()
})
</script>

<template>
  <div class="login-container">
    <ThemeSwitch v-if="settingsStore.showThemeSwitch" class="theme-switch" />
    <Owl :close-eyes="isFocus" />
    <div class="login-card">
      <div class="title">
        <img src="@@/assets/images/layouts/logo-text-2.png">
        <LangSelect />
      </div>
      <div class="content">
        <el-form ref="loginFormRef" :model="loginFormData" :rules="loginFormRules" @keyup.enter="handleLogin">
          <el-form-item v-if="tenantEnabled" prop="tenantId">
            <el-select v-model="loginFormData.tenantId" filterable style="width: 100%">
              <el-option v-for="item in tenantList" :key="item.tenantId" :label="item.companyName" :value="item.tenantId" />
              <template #prefix>
                <SvgIcon name="company" class="el-input__icon input-icon" />
              </template>
            </el-select>
          </el-form-item>
          <el-form-item prop="username">
            <el-input
              v-model.trim="loginFormData.username"
              placeholder="用户名"
              type="text"
              tabindex="1"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="loginFormData.password"
              placeholder="密码"
              type="password"
              tabindex="2"
              :prefix-icon="Lock"
              size="large"
              show-password
              @blur="handleBlur"
              @focus="handleFocus"
            />
          </el-form-item>
          <el-form-item prop="code">
            <el-input
              v-model.trim="loginFormData.code"
              placeholder="验证码"
              type="text"
              tabindex="3"
              :prefix-icon="Key"
              maxlength="7"
              size="large"
              @blur="handleBlur"
              @focus="handleFocus"
            >
              <template #append>
                <el-image :src="codeUrl" draggable="false" @click="createCode">
                  <template #placeholder>
                    <el-icon>
                      <Picture />
                    </el-icon>
                  </template>
                  <template #error>
                    <el-icon>
                      <Loading />
                    </el-icon>
                  </template>
                </el-image>
              </template>
            </el-input>
          </el-form-item>
          <el-checkbox v-model="loginFormData.rememberMe" style="margin: 0 0 25px 0">
            {{ $t('login.rememberPassword') }}
          </el-checkbox>
          <el-form-item style="float: right">
            <el-button circle :title="$t('login.social.wechat')" @click="doSocialLogin('wechat')">
              <SvgIcon name="wechat" />
            </el-button>
            <el-button circle :title="$t('login.social.maxkey')" @click="doSocialLogin('maxkey')">
              <SvgIcon name="maxkey" />
            </el-button>
            <el-button circle :title="$t('login.social.topiam')" @click="doSocialLogin('topiam')">
              <SvgIcon name="topiam" />
            </el-button>
            <el-button circle :title="$t('login.social.gitee')" @click="doSocialLogin('gitee')">
              <SvgIcon name="gitee" />
            </el-button>
            <el-button circle :title="$t('login.social.github')" @click="doSocialLogin('github')">
              <SvgIcon name="github" />
            </el-button>
          </el-form-item>
          <el-button class="submit" :loading="loading" type="primary" size="large" @click.prevent="handleLogin">
            {{ $t('login.login') }}
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100%;
  .theme-switch {
    position: fixed;
    top: 5%;
    right: 5%;
    cursor: pointer;
  }
  .login-card {
    width: 480px;
    max-width: 90%;
    border-radius: 20px;
    box-shadow: 0 0 10px #dcdfe6;
    background-color: var(--el-bg-color);
    overflow: hidden;
    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 150px;
      img {
        height: 100%;
      }
    }
    .content {
      padding: 20px 50px 50px 50px;
      :deep(.el-input-group__append) {
        padding: 0;
        overflow: hidden;
        .el-image {
          width: 100px;
          height: 40px;
          border-left: 0px;
          user-select: none;
          cursor: pointer;
          text-align: center;
        }
      }
      .el-button.submit {
        width: 100%;
        margin-top: 10px;
      }
    }
  }
}
</style>
