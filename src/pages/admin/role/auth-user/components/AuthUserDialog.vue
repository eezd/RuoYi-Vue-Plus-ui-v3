<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { UserQuery, UserVO } from "@/common/apis/admin/system/user/types"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice"
import { formatDateTime } from "@@/utils/index"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { authSysUserSelectAll, unallocatedSysUserListApi } from "@/common/apis/admin/system/role"
import { useDict } from "@/common/composables/useDict"
import { usePagination } from "@/common/composables/usePagination"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const roleId = defineModel<number | string>(
  "roleId",
  {
    required: true
  }
)
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  handleOk: []
}
const handleOk = () => emit("handleOk")
// #endregion

const { isMobile } = useDevice()

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

/**
 * 创建或更新
 */
async function handleCreateOrUpdate() {
  const ids = selectedRows.value.map((user) => {
    return user.userId
  }).join(",")

  if (ids === "") {
    ElMessage.success("请选择要分配的用户")
    return
  }
  await authSysUserSelectAll({ roleId: roleId.value, userIds: ids })
  ElMessage.success("分配成功")
  await handleOk()
  dialogVisible.value = false
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
const searchFormRef = ref<FormInstance | null>(null)

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}
// #endregion

/**
 * 获取数据
 */
async function getTableData(): Promise<void> {
  try {
    loading.value = true
    searchData.roleId = roleId.value
    const { rows, total } = await unallocatedSysUserListApi({
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

watch(dialogVisible, () => {
  if (dialogVisible.value) {
    searchData.roleId = roleId.value
    getTableData()
  }
})
</script>

<template>
  <el-dialog v-model="dialogVisible" title="选择用户" :width="isMobile ? '95%' : '820px'">
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
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleCreateOrUpdate" :loading="loading" :disabled="selectedRows.length === 0">
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
