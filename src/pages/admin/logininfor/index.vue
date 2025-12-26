<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { LoginInfoQuery, LoginInfoVO } from "@/common/apis/admin/monitor/loginInfo/types"
import { usePagination } from "@@/composables/usePagination"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { ref, watch } from "vue"
import { delSysLoginInfoApi, getSysLoginInfoListApi } from "@/common/apis/admin/monitor/loginInfo"
import { useDict } from "@/common/composables/useDict"
import { download } from "@/common/utils/test"
import LoginInforTable from "./components/LoginInforTable.vue"

defineOptions({
  name: "AdminSysLoginInfor"
})

const { sys_common_status } = toRefs<any>(useDict("sys_common_status"))

const loading = ref(true)
// 表格数据
const tableData = ref<LoginInfoVO[]>([])

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 搜索栏
const defaultSort = ref<any>({ prop: "loginTime", order: "descending" })
const searchData = reactive({
  ipaddr: "",
  userName: "",
  status: "",
  orderByColumn: defaultSort.value.prop,
  isAsc: defaultSort.value.order,
  params: {
    beginTime: undefined,
    endTime: undefined
  }
} as LoginInfoQuery)
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
    const { rows, total } = await getSysLoginInfoListApi({
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
async function handleDelete(row: LoginInfoVO | LoginInfoVO[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.infoId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：1，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysLoginInfoApi(deleteIds)
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
    "/monitor/logininfor/export",
    { ...searchData },
    `logininfor_${timestamp}.xlsx`
  )
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
        <el-form-item prop="status" label="登录状态">
          <el-input v-model="searchData.status" placeholder="请输入登录状态" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="status" label="操作状态">
          <el-select class="min-w-[150px]" v-model="searchData.status" placeholder="操作状态" clearable>
            <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="登录时间" style="width: 308px">
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
    <LoginInforTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @get-table-data="getTableData"
      @handle-delete="handleDelete"
      @handle-export="handleExport"
      @handle-current-change="handleCurrentChange"
      @handle-size-change="handleSizeChange"
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
