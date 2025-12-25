<script lang="ts" setup>
import type { OperLogForm } from "@/common/apis/admin/monitor/operlog/types"
import { useDevice } from "@@/composables/useDevice"
import { formatDateTime, selectDictLabel } from "@@/utils/index"
import { cloneDeep } from "lodash-es"
import VueJsonPretty from "vue-json-pretty"
import { useDict } from "@/common/composables/useDict"

/**
 * defineModel
 */
// #region defineModel
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<Partial<OperLogForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { sys_oper_type } = toRefs<any>(useDict("sys_oper_type"))

const title = "查看参数"

const { isMobile } = useDevice()

/**
 * json转为对象
 * @param data 原始数据
 */
function formatToJsonObject(data: string | undefined) {
  try {
    if (!data) return
    return JSON.parse(data)
  } catch {
    return data
  }
}

function typeFormat(row: OperLogForm | Partial<OperLogForm>) {
  if (row.businessType === undefined) return
  return selectDictLabel(sys_oper_type.value, row.businessType)
}

/**
 * 重置表单
 */
function resetForm() {
  formData.value = cloneDeep({})
}
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="title" @closed="resetForm" :width="isMobile ? '90%' : '40%'">
    <el-descriptions v-if="formData" :column="1" border>
      <el-descriptions-item label="操作状态">
        <template #default>
          <el-tag v-if="formData.status === 0" type="success">
            正常
          </el-tag>
          <el-tag v-else-if="formData.status === 1" type="danger">
            失败
          </el-tag>
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="登录信息">
        <template #default>
          {{ formData.operName }} / {{ formData.deptName }} / {{ formData.operIp }} / {{ formData.operLocation }}
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="请求信息">
        <template #default>
          {{ formData.requestMethod }} {{ formData.operUrl }}
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="操作模块">
        <template #default>
          {{ formData.title }} / {{ typeFormat(formData) }}
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="操作方法">
        <template #default>
          {{ formData.method }}
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="请求参数">
        <template #default>
          <div class="max-h-300px overflow-y-auto">
            <VueJsonPretty :data="formatToJsonObject(formData.operParam)" />
          </div>
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="返回参数">
        <template #default>
          <div class="max-h-300px overflow-y-auto">
            <VueJsonPretty :data="formatToJsonObject(formData.jsonResult)" />
          </div>
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="消耗时间">
        <template #default>
          <span> {{ formData.costTime }}ms </span>
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="操作时间">
        <template #default>
          {{ formatDateTime(formData.operTime) }}
        </template>
      </el-descriptions-item>
      <el-descriptions-item v-if="formData.status === 1" label="异常信息">
        <template #default>
          <span class="text-danger"> {{ formData.errorMsg }}</span>
        </template>
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<style lang="scss" scoped>
</style>
