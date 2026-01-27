<script setup lang="ts">
import type { ResetPwdForm, UserForm, UserVO } from "@/common/apis/admin/system/user/types"
import { ref } from "vue"
import { delSysOnlineApi, getSysOnlineApi } from "@/common/apis/admin/monitor/online"
import { getSysUserProfileApi, updateSysUserProfileApi, updateSysUserPwdApi } from "@/common/apis/admin/system/user"
import { formatDateTime } from "@/common/utils"

const loading = ref(false)
const userFormRef = ref<ElFormInstance>()

interface State {
  user: Partial<UserVO>
  roleGroup: string
  auths: any
  devices: any
}

const state = ref<State>({
  user: {},
  roleGroup: "",
  auths: [],
  devices: []
})
async function getUser() {
  const res = await getSysUserProfileApi()
  state.value.user = res.data.user
  userForm.value = { ...res.data.user }
  state.value.roleGroup = res.data.roleGroup
  const devices = await getSysOnlineApi()
  state.value.devices = devices.rows
}

// #region Profile
const userForm = ref<Partial<UserVO>>({})
const ruleProfile: ElFormRules = {
  nickName: [{ required: true, message: "用户昵称不能为空", trigger: "blur" }],
  email: [
    { required: true, message: "邮箱地址不能为空", trigger: "blur" },
    {
      type: "email",
      message: "请输入正确的邮箱地址",
      trigger: ["blur", "change"]
    }
  ],
  phonenumber: [
    {
      required: true,
      message: "手机号码不能为空",
      trigger: "blur"
    },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" }
  ]
}

async function updateProfile() {
  userFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        loading.value = true
        const res = await updateSysUserProfileApi(userForm.value as UserForm)
        ElMessage.success(res.msg)
      } finally {
        // 新增/修改操作后刷新表格
        // await getUser()
        loading.value = false
      }
    }
  })
}
// #endregion Profile

// #region Password
const passwordFormRef = ref<ElFormInstance>()
const passwordForm = ref<ResetPwdForm>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
})
function equalToPassword(rule: any, value: string, callback: any) {
  if (passwordForm.value.newPassword !== value) {
    callback(new Error("两次输入的密码不一致"))
  } else {
    callback()
  }
}
const rulePassword = ref({
  oldPassword: [{ required: true, message: "旧密码不能为空", trigger: "blur" }],
  newPassword: [
    { required: true, message: "新密码不能为空", trigger: "blur" },
    {
      min: 6,
      max: 20,
      message: "长度在 6 到 20 个字符",
      trigger: "blur"
    },
    { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\ |", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "确认密码不能为空", trigger: "blur" },
    {
      required: true,
      validator: equalToPassword,
      trigger: "blur"
    }
  ]
})

async function handlePasswordChange() {
  passwordFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        loading.value = true
        const res = await updateSysUserPwdApi(passwordForm.value.oldPassword, passwordForm.value.newPassword)
        ElMessage.success(res.msg)
      } finally {
        // 新增/修改操作后刷新表格
        loading.value = false
      }
    }
  })
}
// #endregion Password

onMounted(() => {
  getUser()
  // getAuths();
  // getOnlines();
})

// 获取设备图标
function getDeviceIcon(deviceType: string) {
  if (deviceType.includes("Mac") || deviceType.includes("PC")) {
    return "el-icon-monitor"
  } else if (deviceType.includes("Phone")) {
    return "el-icon-mobile-phone"
  } else if (deviceType.includes("iPad") || deviceType.includes("Tablet")) {
    return "el-icon-phone"
  }
  return "el-icon-monitor"
}

async function handleRemoveDevice(device: any) {
  try {
    await ElMessageBox.confirm("删除设备后，在该设备登录需要重新进行验证")
    const res = await delSysOnlineApi(device.tokenId)

    if (res.code === 200) {
      ElMessage.success(res.msg)
      await getUser()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败，请重试")
    }
  }
}
</script>

<template>
  <div class="page-container">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          个人中心
        </h1>
        <p class="text-slate-500 dark:text-slate-400">
          管理您的个人信息和账户安全
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Profile Card -->
        <div class="lg:col-span-1">
          <div class="card sticky top-8">
            <div v-loading="loading" class="flex flex-col items-center">
              <div class="relative mb-4">
                <el-avatar :size="100" class="ring-4 ring-slate-100 dark:ring-slate-700">
                  <i class="el-icon-user-solid text-4xl" />
                </el-avatar>
                <button class="avatar-edit-btn">
                  <i class="el-icon-camera text-sm" />
                </button>
              </div>
              <h3 class="section-title mb-1">
                {{ state.user.nickName }}
              </h3>
              <p class="text-secondary text-sm mb-4">
                {{ state.user.email }}
              </p>

              <div class="w-full space-y-3">
                <div class="info-item">
                  <span class="text-sm text-secondary">账户状态</span>
                  <el-tag type="success" size="small" effect="plain">
                    正常
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="text-sm text-secondary">上次登录时间</span>
                  <span class="text-sm text-primary">{{ state.user.loginDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Forms -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Info Section -->
          <div v-loading="loading" class="card">
            <div class="section-header">
              <div class="section-indicator bg-blue-500" />
              <h2 class="section-title">
                基本信息
              </h2>
            </div>

            <el-form ref="userFormRef" :model="userForm" :rules="ruleProfile" label-position="top" class="space-y-5">
              <div class="form-grid">
                <el-form-item prop="nickName" label="用户名称">
                  <el-input v-model="userForm.nickName" placeholder="请输入用户名称" class="custom-input">
                    <template #suffix>
                      <i class="el-icon-edit text-slate-400" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="sex" label="性别">
                  <el-radio-group v-model="userForm.sex">
                    <el-radio value="0">
                      男
                    </el-radio>
                    <el-radio value="1">
                      女
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
              </div>

              <div class="form-grid">
                <el-form-item prop="phonenumber" label="手机号码">
                  <el-input v-model="userForm.phonenumber" placeholder="请输入手机号码">
                    <template #suffix>
                      <i class="el-icon-phone text-slate-400" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="email" label="邮箱地址">
                  <el-input v-model="userForm.email" placeholder="请输入邮箱地址">
                    <template #suffix>
                      <i class="el-icon-message text-slate-400" />
                    </template>
                  </el-input>
                </el-form-item>
              </div>

              <div class="form-actions">
                <el-button type="primary" class="rounded-lg px-6" @click="updateProfile">
                  更新信息
                </el-button>
              </div>
            </el-form>
          </div>

          <!-- Password Section -->
          <div v-loading="loading" class="card">
            <div class="section-header">
              <div class="section-indicator bg-amber-500" />
              <h2 class="section-title">
                修改密码
              </h2>
            </div>

            <el-form ref="passwordFormRef" :model="passwordForm" :rules="rulePassword" label-position="top" class="space-y-5">
              <el-form-item prop="oldPassword" label="当前密码">
                <el-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  show-password
                >
                  <template #prefix>
                    <i class="el-icon-lock text-slate-400" />
                  </template>
                </el-input>
              </el-form-item>

              <div class="form-grid">
                <el-form-item prop="newPassword" label="新密码">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    show-password
                  >
                    <template #prefix>
                      <i class="el-icon-lock text-slate-400" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="confirmPassword" label="确认新密码">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                  >
                    <template #prefix>
                      <i class="el-icon-lock text-slate-400" />
                    </template>
                  </el-input>
                </el-form-item>
              </div>

              <div class="form-actions">
                <el-button type="primary" class="rounded-lg px-6" @click="handlePasswordChange">
                  更新密码
                </el-button>
              </div>
            </el-form>
          </div>

          <!-- Online Devices Section -->
          <div v-loading="loading" class="card">
            <div class="section-header justify-between">
              <div class="flex items-center">
                <div class="section-indicator bg-green-500" />
                <h2 class="section-title">
                  在线设备
                </h2>
              </div>
              <el-tag type="info" effect="plain">
                {{ state.devices.length }} 台设备
              </el-tag>
            </div>

            <div class="space-y-4">
              <div
                v-for="(device, index) in state.devices"
                :key="index"
                class="device-card"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-4">
                    <div class="device-icon">
                      <i :class="getDeviceIcon(device.deviceType)" class="text-white text-xl" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <h4 class="font-medium text-primary">
                          {{ device.deviceType }}
                        </h4>
                      </div>
                      <div class="space-y-1 text-sm text-secondary">
                        <p class="device-info">
                          <i class="el-icon-monitor text-xs" />
                          <span>{{ device.os }} · {{ device.browser }}</span>
                        </p>
                        <p class="device-info">
                          <i class="el-icon-location text-xs" />
                          <span>{{ device.ipaddr }} · {{ device.loginLocation }}</span>
                        </p>
                        <p class="device-info">
                          <i class="el-icon-time text-xs" />
                          <span>{{ formatDateTime(device.loginTime) }}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="flex sm:flex-col gap-2 sm:items-end">
                    <el-button
                      type="danger"
                      size="small"
                      plain
                      class="rounded-lg"
                      @click="handleRemoveDevice(device)"
                    >
                      移除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 通用样式类 */
.page-container {
  background: linear-gradient(to bottom right, #f8fafc, #e2e8f0);
  padding: 1rem;
}

@media (min-width: 768px) {
  .page-container {
    padding: 2rem;
  }
}

/* 卡片样式 */
.card {
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .card {
    padding: 2rem;
  }
}

/* 区块头部 */
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-indicator {
  width: 0.25rem;
  height: 1.5rem;
  border-radius: 9999px;
  margin-right: 0.75rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

/* 文本颜色 */
.text-primary {
  color: #1e293b;
}

.text-secondary {
  color: #475569;
}

/* 信息项 */
.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
}

/* 表单布局 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.25rem;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

/* 头像编辑按钮 */
.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 2rem;
  height: 2rem;
  background-color: #3b82f6;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
}

.avatar-edit-btn:hover {
  background-color: #2563eb;
}

/* 设备卡片 */
.device-card {
  padding: 1.25rem;
  background-color: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.device-card:hover {
  border-color: #93c5fd;
}

.device-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(to bottom right, #3b82f6, #2563eb);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Element Plus 自定义样式 */
:deep(.el-input__wrapper) {
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: all 0.2s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 0.75rem;
}
</style>
