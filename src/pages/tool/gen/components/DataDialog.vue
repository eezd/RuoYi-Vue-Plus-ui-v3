<script lang="ts" setup>
import { useDevice } from "@@/composables/useDevice.ts"
import { ElMessage } from "element-plus"

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<{
  data: Record<string, string>
  activeName: string
}>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()

function copyTextSuccess() {
  ElMessage.success("复制成功")
}
</script>

<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" :width="isMobile ? '95%' : '820px'">
    <el-tabs v-model="formData.activeName">
      <el-tab-pane
        v-for="(value, key) in formData.data"
        :key="value"
        :label="key.substring(key.lastIndexOf('/') + 1, key.indexOf('.vm'))"
        :name="key.substring(key.lastIndexOf('/') + 1, key.indexOf('.vm'))"
      >
        <el-link v-copyText="value" v-copyText:callback="copyTextSuccess" underline="never" icon="DocumentCopy" style="float: right">
          &nbsp;复制
        </el-link>
        <highlightjs :code="value" />
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<style lang="scss" scoped>
.el-tab-pane {
  background-color: #282c34;
  .el-link {
    color: #fff;
  }
}
</style>
