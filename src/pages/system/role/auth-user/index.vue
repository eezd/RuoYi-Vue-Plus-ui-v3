<script lang="ts" setup>
import type { RoleForm } from "@@/apis/system/role/types.ts"
import type { UserQuery, UserVO } from "@@/apis/system/user/types.ts"
import { delSysRoleApi, getRoleAuthorizedUsersListApi, revokeRoleFromUserApi } from "@@/apis/system/role"
import { usePagination } from "@@/composables/usePagination.ts"
import { CircleClose, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { ref, watch } from "vue"
import { download } from "@/http/download"
import AuthUserDialog from "./components/AuthUserDialog.vue"
import AuthUserTable from "./components/AuthUserTable.vue"

defineOptions({
  name: "AdminSysRoleAuthUser"
})

// 确保 roleId 是单个值
const getRoleId = computed(() => {
  const id = route.params.roleId
  return Array.isArray(id) ? id[0] : id
})

const route = useRoute()

const loading = ref(true)

// 表格数据
const tableData = ref<UserVO[]>([])

const dialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 搜索栏
const searchData = reactive({
  userName: undefined,
  phonenumber: undefined,
  roleId: route.params.roleId as string
} as UserQuery)
const searchFormRef = useTemplateRef("searchFormRef")

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}
// #endregion

// #region 表单操作
/**
 * 获取数据
 */
async function getTableData(): Promise<void> {
  try {
    loading.value = true
    const { rows, total } = await getRoleAuthorizedUsersListApi({
      ...searchData,
      pageNum: paginationData.currentPage,
      pageSize: paginationData.pageSize
    })
    tableData.value = rows
    paginationData.total = total
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 删除
 */
async function handleDelete(row: RoleForm | RoleForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.roleId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.roleName}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysRoleApi(deleteIds)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}

/**
 * 导出
 */
function handleExport() {
  const timestamp = new Date().getTime()
  download(
    "/system/role/export",
    { ...searchData },
    `role_${timestamp}.xlsx`
  )
}
// #endregion

// #region 弹窗操作
/**
 * 打开新增弹窗
 */
function openAddDialog() {
  dialog.title = "新增用户"
  dialog.visible = true
}

/**
 * 取消角色授权
 */
async function cancelAuthUser(row: UserVO) {
  await ElMessageBox.confirm(`确认要取消该用户"${row.userName}"角色吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  await revokeRoleFromUserApi({ userId: row.userId as number, roleId: searchData.roleId as number })
  await getTableData()
  ElMessage.success("取消授权成功")
}
// #endregion

// #region 监听
/**
 * 监听分页参数的变化
 */
watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    getTableData()
  }
)
// #endregion

onMounted(async () => {
  await getTableData()
  loading.value = false
})
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="userName" label="用户名称">
          <el-input v-model="searchData.userName" placeholder="请输入用户名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="phonenumber" label="手机号码">
          <el-input v-model="searchData.phonenumber" placeholder="请输入手机号码" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="getTableData">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <AuthUserTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @open-add-dialog="openAddDialog"
      @get-table-data="getTableData"
      @handle-delete="handleDelete"
      @handle-export="handleExport"
      @handle-current-change="handleCurrentChange"
      @handle-size-change="handleSizeChange"
    >
      <template #operation="{ scope }">
        <div style="display: flex; align-items: center; gap: 10px">
          <el-button
            type="primary"
            :icon="CircleClose"
            text
            bg
            size="small"
            v-hasPermi="['system:role:remove']"
            @click="cancelAuthUser(scope.row)"
          >
            取消授权
          </el-button>
        </div>
      </template>
    </AuthUserTable>

    <!-- 数据弹窗 -->
    <AuthUserDialog
      v-model:dialog="dialog"
      v-model:role-id="getRoleId"
      @success="getTableData"
    />
  </div>
</template>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}
</style>
