<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FlowDefinitionVO } from "@/common/apis/workflow/definition/types"
import type { LeaveForm } from "@/common/apis/workflow/leave/types"

interface Option {
  label: string
  value: string
}

interface Props {
  pageType: "add" | "update" | "view" | "approval"
  formDisabled: boolean
  flowCodeOptions: FlowDefinitionVO[]
  leaveTypeOptions: Option[]
}
defineProps<Props>()

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const formData = defineModel<Partial<LeaveForm>>("formData", { required: true })
const leaveTime = defineModel<[string, string] | []>("leaveTime", { required: true })
const flowCode = defineModel<string>("flowCode", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  leaveTimeChange: []
}
const leaveTimeChange = () => emit("leaveTimeChange")
// #endregion

const formRef = useTemplateRef<FormInstance>("formRef")
const formRules: FormRules<LeaveForm> = {
  leaveType: [{ required: true, message: "请选择请假类型", trigger: "change" }],
  leaveDays: [{ required: true, message: "请假天数不能为空", trigger: "blur" }],
  remark: [{ required: true, message: "请填写请假原因", trigger: "blur" }]
}

async function validate() {
  if (!formRef.value) return false
  await formRef.value.validate()
  return true
}

defineExpose({
  validate
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="100px"
  >
    <el-form-item label="流程定义" v-if="pageType === 'add'">
      <el-select v-model="flowCode" :disabled="formDisabled" placeholder="请选择流程定义" style="width: 100%">
        <el-option v-for="item in flowCodeOptions" :key="item.id" :label="item.flowName" :value="item.flowCode" />
      </el-select>
    </el-form-item>
    <el-form-item label="请假类型" prop="leaveType">
      <el-select v-model="formData.leaveType" :disabled="formDisabled" placeholder="请选择请假类型" style="width: 100%">
        <el-option v-for="item in leaveTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="请假时间" required>
      <el-date-picker
        v-model="leaveTime"
        :disabled="formDisabled"
        value-format="YYYY-MM-DD HH:mm:ss"
        type="daterange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
        @change="leaveTimeChange"
      />
    </el-form-item>
    <el-form-item label="请假天数" prop="leaveDays">
      <el-input v-model="formData.leaveDays" disabled />
    </el-form-item>
    <el-form-item label="请假原因" prop="remark">
      <el-input v-model="formData.remark" :disabled="formDisabled" type="textarea" :rows="3" placeholder="请输入请假原因" />
    </el-form-item>
  </el-form>
</template>

<style lang="scss" scoped>
</style>
