<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { NoticeForm, NoticeQuery } from "@/common/apis/admin/notice/types"
import { usePagination } from "@@/composables/usePagination"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { delSysNoticeApi, getSysNoticeApi, getSysNoticeListApi } from "@/common/apis/admin/notice"
import { useDict } from "@/common/composables/useDict"
import NoticeDialog from "./components/NoticeDialog.vue"
import NoticeTable from "./components/NoticeTable.vue"

defineOptions({
  name: "AdminSysNotice"
})

const { sys_notice_type } = toRefs<any>(useDict("sys_notice_type"))

const loading = ref(true)
// 表格数据
const tableData = ref<NoticeForm[]>([])
// 表单数据
const formData = ref<Partial<NoticeForm>>(cloneDeep({}))
// 数据弹窗
const dataDialogVisible = ref<boolean>(false)
// 数据弹窗的数据是否可编辑
const isEditableInDataDialog = ref<boolean>(true)

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 搜索栏
const searchData = reactive({
  noticeTitle: "",
  createByName: "",
  noticeType: "",
  params: {
    beginTime: undefined,
    endTime: undefined
  }
} as NoticeQuery)
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
    const { rows, total } = await getSysNoticeListApi({
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
async function handleDelete(row: NoticeForm | NoticeForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.noticeId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.noticeTitle}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysNoticeApi(deleteIds)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}

/**
 * 打开新增弹窗
 */
function openAddDialog() {
  formData.value = cloneDeep({})
  isEditableInDataDialog.value = true
  dataDialogVisible.value = true
}

/**
 * 打开修改弹窗
 *
 * @param row
 */
async function openUpdateDialog(row: NoticeForm) {
  loading.value = true
  isEditableInDataDialog.value = true
  dataDialogVisible.value = true
  try {
    formData.value = cloneDeep({})
    const { data } = await getSysNoticeApi(row.noticeId)
    formData.value = data as NoticeForm
  } finally {
    loading.value = false
  }
}

/**
 * 打开查看弹窗
 *
 * @param row
 */
async function openShowDialog(row: NoticeForm) {
  loading.value = true
  isEditableInDataDialog.value = false
  dataDialogVisible.value = true
  try {
    formData.value = cloneDeep({})
    const { data } = await getSysNoticeApi(row.noticeId)
    formData.value = data as NoticeForm
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
        <el-form-item prop="noticeTitle" label="公告标题">
          <el-input v-model="searchData.noticeTitle" placeholder="请输入公告标题" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="createByName" label="操作人员">
          <el-input v-model="searchData.createByName" placeholder="请输入操作人员" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="noticeType" label="公告类型">
          <el-select class="min-w-[150px]" v-model="searchData.noticeType" placeholder="公告类型" clearable>
            <el-option v-for="dict in sys_notice_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
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
    <NoticeTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @open-add-dialog="openAddDialog"
      @get-table-data="getTableData"
      @handle-delete="handleDelete"
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
    </NoticeTable>

    <!-- 数据弹窗 -->
    <NoticeDialog
      v-model:loading="loading"
      v-model:data-dialog-visible="dataDialogVisible"
      v-model:is-editable="isEditableInDataDialog"
      v-model:form-data="formData"
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
