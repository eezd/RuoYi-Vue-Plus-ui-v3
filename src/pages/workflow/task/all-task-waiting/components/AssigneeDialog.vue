<script lang="ts" setup>
import type { UserVO } from "@/common/apis/system/user/types"

export interface AssigneeDialogForm {
  userId: string
}

interface Props {
  userOptions: UserVO[]
  userLoading: boolean
}
defineProps<Props>()

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<AssigneeDialogForm>("formData", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  submit: []
  remoteSearchUsers: [keyword: string]
}
const submit = () => emit("submit")
const remoteSearchUsers = (keyword: string) => emit("remoteSearchUsers", keyword)
// #endregion
</script>

<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title || '修改办理人'" width="420px">
    <el-form label-width="90px">
      <el-form-item label="办理人">
        <el-select
          v-model="formData.userId"
          filterable
          remote
          clearable
          :remote-method="remoteSearchUsers"
          :loading="userLoading"
          placeholder="请选择办理人"
          class="w-full"
        >
          <el-option
            v-for="item in userOptions"
            :key="item.userId"
            :label="`${item.nickName} (${item.userName})`"
            :value="String(item.userId)"
          />
        </el-select>
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
