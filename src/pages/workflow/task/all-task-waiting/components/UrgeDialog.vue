<script lang="ts" setup>
export interface UrgeDialogForm {
  messageType: string
  message: string
}

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<UrgeDialogForm>("formData", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  submit: []
}
const submit = () => emit("submit")
// #endregion
</script>

<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title || '催办任务'" width="520px">
    <el-form label-width="90px">
      <el-form-item label="消息类型">
        <el-select v-model="formData.messageType" class="w-full">
          <el-option label="站内消息" value="system" />
          <el-option label="短信" value="sms" />
          <el-option label="邮件" value="email" />
        </el-select>
      </el-form-item>
      <el-form-item label="催办内容">
        <el-input v-model="formData.message" type="textarea" :rows="3" placeholder="请输入催办内容（可选）" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialog.visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="dialog.loading" @click="submit">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
</style>
