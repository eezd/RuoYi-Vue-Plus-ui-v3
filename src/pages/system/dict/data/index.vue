<script lang="ts" setup>
import type { DictDataForm, DictDataQuery } from "@@/apis/system/dict/data/types.ts"
import type { DictTypeVO } from "@@/apis/system/dict/type/types.ts"
import { delSysDictDataApi, getSysDictDataCodeApi, getSysDictDataListApi } from "@@/apis/system/dict/data"
import { getSysDictOptionSelectApi, getSysDictTypeApi } from "@@/apis/system/dict/type"
import { usePagination } from "@@/composables/usePagination.ts"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { useRoute } from "vue-router"
import { download } from "@/http/download"
import DictDataDialog from "./components/DictDialog.vue"
import DictTable from "./components/DictTable.vue"

defineOptions({
  name: "AdminSysDictData"
})

const route = useRoute()

const loading = ref(true)
// 表格数据
const tableData = ref<DictDataForm[]>([])
const DEFAULT_FORM_DATA: Partial<DictDataForm> = {
  dictCode: undefined,
  dictLabel: "",
  dictValue: "",
  cssClass: "",
  listClass: "primary",
  dictSort: 0,
  remark: ""
}
// 表单数据
const formData = ref<Partial<DictDataForm>>(cloneDeep(DEFAULT_FORM_DATA))
const dialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 保存初始的字典类型, 防止重置时清空
const defaultDictType = ref("")

// #region 搜索栏
// 搜索
const searchData = reactive({
  dictName: "",
  dictType: "",
  dictLabel: ""
} as DictDataQuery)
const searchFormRef = useTemplateRef("searchFormRef")

const typeOptions = ref<DictTypeVO[]>([])
/**
 * 查询字典类型列表
 */
async function getTypeList() {
  const res = await getSysDictOptionSelectApi()
  typeOptions.value = res.data
}
function resetSearch() {
  searchFormRef.value?.resetFields()
  searchData.dictType = defaultDictType.value
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
    const { rows, total } = await getSysDictDataListApi({
      ...searchData,
      pageNum: paginationData.currentPage,
      pageSize: paginationData.pageSize
    })
    tableData.value = rows
    paginationData.total = total
  } catch {
    tableData.value = []
    searchData.dictType = ""
  } finally {
    loading.value = false
  }
}

/**
 * 删除
 */
async function handleDelete(row: DictDataForm | DictDataForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.dictCode)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.dictLabel}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysDictDataApi(deleteIds)
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
    "/system/dict/data/export",
    { ...searchData },
    `dict_data_${timestamp}.xlsx`
  )
}
// #endregion

// #region 弹窗操作
/**
 * 统一处理数据弹窗
 *
 * @param type 操作类型,支持 "add"(新增)、"edit"(编辑)、"show"(查看)
 * @param row 可选参数,编辑或查看时传入对应的菜单项
 */
async function handleOpenDialog(type: "add" | "edit" | "show", row?: DictDataForm) {
  dialog.visible = true
  dialog.isEditable = type !== "show"
  dialog.title = { add: "新增", edit: "修改", show: "查看" }[type]

  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  if ((type === "edit" || type === "show") && row) {
    dialog.loading = true
    try {
      const { data } = await getSysDictDataCodeApi(row.dictCode)
      Object.assign(formData.value, data)
    } finally {
      dialog.loading = false
    }
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
  await getTypeList()
  const { data } = await getSysDictTypeApi(route.params && (route.params.dictId as string))
  searchData.dictType = data.dictType
  defaultDictType.value = data.dictType
  await getTableData()
  loading.value = false
})
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="dictType" label="字典名称">
          <el-select v-model="searchData.dictType" size="default" filterable>
            <el-option v-for="item in typeOptions" :key="item.dictId" :label="item.dictName" :value="item.dictType" />
          </el-select>
        </el-form-item>
        <el-form-item prop="dictLabel" label="字典标签">
          <el-input v-model="searchData.dictLabel" placeholder="请输入字典标签" @keyup.enter="getTableData" />
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
    <DictTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @open-add-dialog="handleOpenDialog('add')"
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
            @click="handleOpenDialog('show', scope.row)"
          >
            查看
          </el-button>
          <el-dropdown trigger="hover">
            <span class="el-dropdown-link">
              <el-icon color="#409EFF"><more-filled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleOpenDialog('edit', scope.row)" v-if="checkPermission(['system:dict:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['system:dict:remove'])">
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
      v-model:dialog="dialog"
      v-model:form-data="formData"
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
