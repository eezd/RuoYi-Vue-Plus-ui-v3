<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { RoleVO } from "@/common/apis/admin/role/types"
import type { UserForm, UserQuery, UserVO } from "@/common/apis/admin/user/types"
import { usePagination } from "@@/composables/usePagination"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { getSysConfigKeyApi } from "@/common/apis/admin/config"
import { delSysUserApi, getSysUserApi, getSysUserListApi } from "@/common/apis/admin/user"
import { useDict } from "@/common/composables/useDict"
import { download } from "@/common/utils/test"
import UserDialog from "./components/UserDialog.vue"
import UserTable from "./components/UserTable.vue"

defineOptions({
  name: "AdminSysUser"
})

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const loading = ref(true)

// 表格数据
const tableData = ref<UserVO[]>([])

const DEFAULT_FORM_DATA = { status: "0" }
// 表单数据
const formData = ref<Partial<UserForm>>(cloneDeep(DEFAULT_FORM_DATA))
// 数据弹窗
const dataDialogVisible = ref<boolean>(false)
// 数据弹窗的数据是否可编辑
const isDataDialogEditable = ref<boolean>(true)

const roleOptions = ref<RoleVO[]>([])
const initPassword = ref<string>("")

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 搜索栏
const searchData = reactive({
  userName: "",
  phonenumber: "",
  status: "",
  roleId: "",
  params: {
    beginTime: "",
    endTime: ""
  }
} as UserQuery)
const searchFormRef = ref<FormInstance | null>(null)

const dateRange = ref<[DateModelType, DateModelType]>(["", ""])
watch(dateRange, ([newBeginTime, newEndTime]) => {
  searchData.params = {}
  searchData.params.beginTime = newBeginTime.toLocaleString()
  searchData.params.endTime = newEndTime.toLocaleString()
})

function resetSearch() {
  searchFormRef.value?.resetFields()
  dateRange.value = ["", ""]
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
    const { rows, total } = await getSysUserListApi({
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
async function handleDelete(row: UserForm | UserForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.userId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.userName}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysUserApi(deleteIds)
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
    "/system/User/type/export",
    { ...searchData },
    `User_${timestamp}.xlsx`
  )
}

/**
 * 打开添加弹窗
 */
async function openAddDialog() {
  formData.value = cloneDeep({})

  const { data } = await getSysUserApi()
  roleOptions.value = data.roles
  formData.value.password = initPassword.value.toString()

  isDataDialogEditable.value = true
  dataDialogVisible.value = true
  loading.value = false
}

/**
 * 打开修改弹窗
 */
async function openUpdateDialog(row: UserForm) {
  loading.value = true
  isDataDialogEditable.value = true
  dataDialogVisible.value = true
  formData.value = cloneDeep({})
  const userId = row?.userId
  const { data } = await getSysUserApi(userId)
  Object.assign(formData.value, data.user)
  roleOptions.value = Array.from(
    new Map([...data.roles, ...data.user.roles].map(role => [role.roleId, role])).values()
  )
  formData.value.roleIds = data.roleIds
  formData.value.password = ""
  loading.value = false
}

/**
 * 打开查看弹窗
 */
async function openShowDialog(row: UserForm) {
  loading.value = true
  isDataDialogEditable.value = false
  dataDialogVisible.value = true
  formData.value = cloneDeep({})
  const userId = row?.userId
  const { data } = await getSysUserApi(userId)
  Object.assign(formData.value, data.user)
  roleOptions.value = Array.from(
    new Map([...data.roles, ...data.user.roles].map(role => [role.roleId, role])).values()
  )
  formData.value.roleIds = data.roleIds
  formData.value.password = ""
  loading.value = false
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
  await getSysConfigKeyApi("sys.user.initPassword").then((response) => {
    initPassword.value = response.data
  })
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
        <el-form-item prop="nickName" label="用户昵称">
          <el-input v-model="searchData.nickName" placeholder="请输入用户昵称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="phonenumber" label="手机号码">
          <el-input v-model="searchData.phonenumber" placeholder="请输入手机号码" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select class="min-w-[100px]" v-model="searchData.status" placeholder="角色状态" clearable>
            <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" style="width: 308px">
          <el-date-picker
            v-model="dateRange"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
          />
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
    <UserTable
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
            :icon="Search"
            text
            bg
            size="small"
            @click="openShowDialog(scope.row)"
          >
            查看
          </el-button>
          <el-dropdown trigger="hover">
            <span class="el-dropdown-link">
              <el-icon color="#409EFF"><more-filled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openUpdateDialog(scope.row)">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)">
                  <el-icon color="#F56C6C">
                    <Delete />
                  </el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </UserTable>

    <!-- 数据弹窗 -->
    <UserDialog
      v-model:loading="loading"
      v-model:data-dialog-visible="dataDialogVisible"
      v-model:is-editable="isDataDialogEditable"
      v-model:form-data="formData"
      v-model:role-options="roleOptions"
      @get-table-data="getTableData"
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
