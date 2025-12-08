<script lang="ts" setup>
import type { DictTypeForm, DictTypeQuery } from "@/common/apis/admin/dict/type/types"
import { usePagination } from "@@/composables/usePagination"
import { Delete, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { delSysDictTypeApi, getSysDictListTypeApi } from "@/common/apis/admin/dict/type"
import { download } from "@/common/utils/test"
import DictDataDialog from "./components/DictDataDialog.vue"
import DictSearchForm from "./components/DictSearchForm.vue"
import DictTable from "./components/DictTable.vue"

defineOptions({
  name: "AdminSysDict"
})

const loading = ref(false)
// 表格数据
const tableData = ref<DictTypeForm[]>([])
// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 表单数据
const formData = ref<Partial<DictTypeForm>>(cloneDeep({}))

const searchData = reactive({
  dictName: "",
  dictType: "",
  beginTime: "",
  endTime: ""
} as DictTypeQuery)

// 数据弹窗
const dataDialogVisible = ref<boolean>(false)
// 数据弹窗的数据是否可编辑
const isDataDialogEditable = ref<boolean>(true)

// #region 表单操作
/**
 * 删除
 *
 * @param row
 */
function handleDelete(row: DictTypeForm | DictTypeForm[]) {
  let del_id: (number | string)[] = []
  let msg = ""
  if (Array.isArray(row)) {
    del_id = row.map((item) => {
      return item.dictId
    })
    msg = `正在删除：${row.length} 条数据，确认删除？`
  } else {
    del_id.push(row.dictId)
    msg = `正在删除：${row.dictName}，确认删除？`
  }
  console.log(del_id)
  ElMessageBox.confirm(msg, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      loading.value = true
      delSysDictTypeApi(del_id)
        .then((res) => {
          ElMessage.success(res.msg)
          getTableData()
        })
        .finally(() => {
          loading.value = false
        })
    })
    .catch(() => {})
}

/**
 * 导出
 */
function handleExport() {
  download(
    "/system/dict/type/export",
    { ...searchData },
    `dict_${new Date().getTime()}.xlsx`
  )
}

/**
 * 打开添加弹窗
 */
function openAddDialog() {
  // resetForm()
  dataDialogVisible.value = true
  formData.value = cloneDeep({})
}

/**
 * 打开修改弹窗
 *
 * @param row
 */
function openUpdateDialog(row: any) {
  isDataDialogEditable.value = true
  dataDialogVisible.value = true
  formData.value = cloneDeep(row)
}

/**
 * 打开查看弹窗
 *
 * @param row
 */
function openShowDialog(row: any) {
  isDataDialogEditable.value = false
  dataDialogVisible.value = true
  formData.value = cloneDeep(row)
}

/**
 * 获取表格数据
 *
 * @param params
 */
async function getTableData(params?: DictTypeQuery): Promise<void> {
  try {
    loading.value = true
    await getSysDictListTypeApi({
      pageNum: paginationData.currentPage,
      pageSize: paginationData.pageSize,
      ...params
    }).then(({ rows, total }) => {
      paginationData.total = total
      tableData.value = rows
    })
  } catch {
    tableData.value = []
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
  },
  { immediate: true }
)

/**
 * 弹窗关闭后刷新表格
 */
watch([() => dataDialogVisible.value], ([dataDialogVisible]) => {
  if (!dataDialogVisible) {
    getTableData()
  }
})
// #endregion
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <DictSearchForm v-model:loading="loading" v-model:search-data="searchData" @get-table-data="getTableData" />

    <!-- 表格 -->
    <DictTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @open-add-dialog="openAddDialog"
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
    </DictTable>

    <!-- 数据弹窗 -->
    <DictDataDialog
      v-model:loading="loading"
      v-model:data-dialog-visible="dataDialogVisible"
      v-model:is-editable="isDataDialogEditable"
      v-model:form-data="formData"
    />
  </div>
</template>

<style lang="scss" scoped>

</style>
