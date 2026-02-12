<script lang="ts" setup>
import type { OnlineQuery, OnlineVO } from "@@/apis/monitor/online/types"
import { forceLogoutSysOnlineApi, getSysOnlineListApi } from "@@/apis/monitor/online"
import { usePagination } from "@@/composables/usePagination.ts"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { ref, watch } from "vue"
import OnlineTable from "./components/OnlineTable.vue"

defineOptions({
  name: "AdminSysOnline"
})

const loading = ref(true)
// 表格数据
const tableData = ref<OnlineVO[]>([])

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 搜索栏
const searchData = reactive({
  ipaddr: "",
  userName: ""
} as OnlineQuery)
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
    const { rows, total } = await getSysOnlineListApi({
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
async function handleDelete(row: OnlineVO) {
  try {
    await ElMessageBox.confirm(`是否确认强退名称为"${row.userName}"的用户?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await forceLogoutSysOnlineApi(row.tokenId)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
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
        <el-form-item prop="ipaddr" label="登录地址">
          <el-input v-model="searchData.ipaddr" placeholder="请输入登录地址" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="userName" label="用户名称">
          <el-input v-model="searchData.userName" placeholder="请输入用户名称" @keyup.enter="getTableData" />
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
    <OnlineTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @get-table-data="getTableData"
      @handle-current-change="handleCurrentChange"
      @handle-size-change="handleSizeChange"
    >
      <template #operation="{ scope }">
        <el-tooltip content="强退" placement="top">
          <el-button
            v-hasPermi="['monitor:online:forceLogout']"
            link type="primary" icon="Delete" @click="handleDelete(scope.row)"
          />
        </el-tooltip>
      </template>
    </OnlineTable>
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
