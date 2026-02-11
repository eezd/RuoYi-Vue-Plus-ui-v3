<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { OssQuery, OssVO } from "@/common/apis/admin/system/oss/types"
import { usePagination } from "@@/composables/usePagination.ts"
import { checkPermission } from "@@/utils/permission"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { ref, watch } from "vue"
import { getSysConfigKeyApi } from "@/common/apis/admin/system/config"
import { delSysOssApi, getSysOssListApi } from "@/common/apis/admin/system/oss"
import { downloadOss } from "@/http/download"
import OssTable from "./components/OssTable.vue"

defineOptions({
  name: "AdminSysOss"
})
const loading = ref(true)

// 表格数据
const tableData = ref<OssVO[]>([])

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const previewListResource = ref(true)

// #region 搜索栏
const searchData = reactive({
  fileName: "",
  originalName: "",
  fileSuffix: "",
  service: "",
  params: {
    beginTime: undefined,
    endTime: undefined
  }
} as OssQuery)
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
    const res = await getSysConfigKeyApi("sys.oss.previewListResource")
    previewListResource.value = res?.data === undefined ? true : res.data === "true"
    const { rows, total } = await getSysOssListApi({
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
async function handleDelete(row: OssVO | OssVO[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.ossId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.fileName}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysOssApi(deleteIds)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}

/** 下载按钮操作 */
function handleDownload(row: OssVO) {
  downloadOss(row.ossId)
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
        <el-form-item prop="fileName" label="文件名">
          <el-input v-model="searchData.fileName" placeholder="请输入文件名" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="originalName" label="原文件名">
          <el-input v-model="searchData.originalName" placeholder="请输入原文件名" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="fileSuffix" label="文件后缀">
          <el-input v-model="searchData.fileSuffix" placeholder="请输入文件后缀" @keyup.enter="getTableData" />
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
        <el-form-item label="服务商" prop="service">
          <el-input v-model="searchData.service" placeholder="请输入服务商" clearable @keyup.enter="getTableData" />
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
    <OssTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      v-model:preview-list-resource="previewListResource"
      @get-table-data="getTableData"
      @handle-delete="handleDelete"
      @handle-current-change="handleCurrentChange"
      @handle-size-change="handleSizeChange"
    >
      <template #operation="{ scope }">
        <el-tooltip content="下载" placement="top">
          <el-button :disabled="!checkPermission(['system:oss:download'])" link type="primary" icon="Download" @click="handleDownload(scope.row)" />
        </el-tooltip>
        <el-tooltip content="删除" placement="top">
          <el-button :disabled="!checkPermission(['system:oss:remove'])" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
        </el-tooltip>
      </template>
    </OssTable>
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
