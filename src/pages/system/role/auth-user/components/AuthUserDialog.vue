<script lang="ts" setup>
import type { UserQuery, UserVO } from "@@/apis/system/user/types.ts"
import { assignRoleToUsersApi, getRoleUnauthorizedUsersListApi } from "@@/apis/system/role"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { usePagination } from "@@/composables/usePagination.ts"
import { formatDateTime } from "@@/utils"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { ref } from "vue"

export interface EmitEvents {
  (e: "success"): void
  (e: "cancel"): void
}
const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const roleId = defineModel<number | string>(
  "roleId",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()
const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

async function handleSubmit() {
  const ids = selectedRows.value.map((user) => {
    return user.userId
  }).join(",")
  if (ids === "") {
    ElMessage.success("请选择要分配的用户")
    return
  }
  await assignRoleToUsersApi({ roleId: roleId.value as number, userIds: ids })
  ElMessage.success("分配成功")
  emit("success")
  dialog.value.visible = false
}

const tableData = ref<UserVO[]>([])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const selectedRows = ref<UserVO[]>([])
const handleSelectionChange = (val: UserVO[]) => (selectedRows.value = val)

// #region 搜索栏
const searchData = reactive({
  userName: "",
  phonenumber: ""
} as UserQuery)
const searchFormRef = useTemplateRef("searchFormRef")

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}
// #endregion

async function getTableData(): Promise<void> {
  try {
    dialog.value.loading = true
    searchData.roleId = roleId.value
    const { rows, total } = await getRoleUnauthorizedUsersListApi({
      ...searchData,
      pageNum: paginationData.currentPage,
      pageSize: paginationData.pageSize
    })
    tableData.value = rows
    paginationData.total = total
  } catch {
    tableData.value = []
  } finally {
    dialog.value.loading = false
  }
}

function handleCancel() {
  resetSearch()
  dialog.value.visible = false
  emit("cancel")
}

watch(() => dialog.value.visible, () => {
  if (dialog.value.visible) {
    searchData.roleId = roleId.value
    getTableData()
  }
})
</script>

<template>
  <el-dialog v-model="dialog.visible" title="选择用户" :width="isMobile ? '95%' : '820px'">
    <!-- 查询表单 -->
    <el-card v-loading="dialog.loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="userName" label="用户名称">
          <el-input v-model="searchData.userName" placeholder="请输入用户名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="nickName" label="用户昵称">
          <el-input v-model="searchData.nickName" placeholder="请输入用户昵称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="phonenumber" label="手机号码">
          <el-input v-model="searchData.phonenumber" placeholder="请输入手机号码" @keyup.enter="getTableData" />
        </el-form-item>
        <el-button type="primary" :icon="Search" @click="getTableData">
          查询
        </el-button>
        <el-button :icon="Refresh" @click="resetSearch">
          重置
        </el-button>
      </el-form>

      <div class="table-wrapper">
        <el-table :data="tableData" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="userName" label="用户名称" align="center" min-width="100" />
          <el-table-column prop="nickName" label="用户昵称" align="center" min-width="100" />
          <el-table-column prop="email" label="邮箱" align="center" min-width="100" />
          <el-table-column prop="phonenumber" label="手机号码" align="center" min-width="140" />
          <el-table-column prop="status" label="状态" align="center">
            <template #default="scope">
              <DictTag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" prop="createTime" min-width="160">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pager-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <template #footer>
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="dialog.loading" :disabled="selectedRows.length === 0">
          确认
        </el-button>
      </template>
    </el-card>
  </el-dialog>
</template>

<style lang="scss" scoped>
.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
