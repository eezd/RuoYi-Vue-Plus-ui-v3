<script lang="ts" setup>
import type { OperLogForm, OperLogQuery, OperLogVO } from "@@/apis/monitor/operlog/types.ts"
import { delSysOperlogApi, getSysOperlogListApi } from "@@/apis/monitor/operlog"
import { useDict } from "@@/composables/useDict.ts"
import { usePagination } from "@@/composables/usePagination.ts"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { download } from "@/http/download"
import OperLogDialog from "./components/OperLogDialog.vue"
import OperLogTable from "./components/OperLogTable.vue"

defineOptions({
  name: "AdminSysOperLog"
})

const { sys_oper_type, sys_common_status } = toRefs<any>(useDict("sys_oper_type", "sys_common_status"))

const loading = ref(true)
// 表格数据
const tableData = ref<OperLogVO[]>([])
const DEFAULT_FORM_DATA: Partial<OperLogForm> = {
  operId: undefined,
  tenantId: undefined,
  title: "",
  businessType: 0,
  businessTypes: undefined,
  method: "",
  requestMethod: "",
  operatorType: 0,
  operName: "",
  deptName: "",
  operUrl: "",
  operIp: "",
  operLocation: "",
  operParam: "",
  jsonResult: "",
  status: 0,
  errorMsg: "",
  operTime: "",
  costTime: 0
}
// 表单数据
const formData = ref<Partial<OperLogForm>>(cloneDeep(DEFAULT_FORM_DATA))
// 数据弹窗
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
  operIp: "",
  title: "",
  operName: "",
  businessType: "",
  status: "",
  params: {
    beginTime: undefined,
    endTime: undefined
  }
} as OperLogQuery)
const searchFormRef = useTemplateRef("searchFormRef")

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
    const { rows, total } = await getSysOperlogListApi({
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
async function handleDelete(row: OperLogForm | OperLogForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.operId)
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
    const res = await delSysOperlogApi(deleteIds)
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
    "/monitor/operlog/export",
    { ...searchData },
    `operlog_${timestamp}.xlsx`
  )
}
// #endregion

// #region 弹窗操作
/**
 * 打开查看弹窗
 *
 * @param row
 */
async function openShowDialog(row: OperLogForm) {
  dialog.loading = true
  formData.value = cloneDeep(row)
  dialog.title = "查看操作日志"
  dialog.visible = true
  dialog.loading = false
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
        <el-form-item prop="operIp" label="操作地址">
          <el-input v-model="searchData.operIp" placeholder="请输入操作地址" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="title" label="系统模块">
          <el-input v-model="searchData.title" placeholder="请输入系统模块" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="operName" label="操作人员">
          <el-input v-model="searchData.operName" placeholder="请输入操作人员" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="businessType" label="类型">
          <el-select v-model="searchData.businessType" placeholder="操作类型" clearable>
            <el-option v-for="dict in sys_oper_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" label="操作状态">
          <el-select class="min-w-[150px]" v-model="searchData.status" placeholder="操作状态" clearable>
            <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间" style="width: 308px">
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
    <OperLogTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
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
        </div>
      </template>
    </OperLogTable>

    <!-- 数据弹窗 -->
    <OperLogDialog
      v-model:dialog="dialog"
      v-model:form-data="formData"
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
