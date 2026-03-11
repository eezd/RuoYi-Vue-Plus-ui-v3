<script lang="ts" setup>
import type { SpelForm, SpelQuery, SpelVO } from "@/common/apis/workflow/spel/types"
import { usePagination } from "@@/composables/usePagination.ts"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { delWorkflowSpelApi, getWorkflowSpelApi, getWorkflowSpelListApi } from "@/common/apis/workflow/spel"
import { useDict } from "@/common/composables/useDict"
import SpelDialog from "./components/SpelDialog.vue"
import SpelTable from "./components/SpelTable.vue"

defineOptions({
  name: "AdminWorkflowSpel"
})

const { sys_common_status } = toRefs<any>(useDict("sys_common_status"))

const loading = ref(true)

// 表格数据
const tableData = ref<SpelVO[]>([])
const DEFAULT_FORM_DATA: Partial<SpelForm> = {
  id: undefined,
  componentName: undefined,
  methodName: undefined,
  methodParams: undefined,
  viewSpel: undefined,
  status: "0",
  remark: undefined
}
// 表单数据
const formData = ref<Partial<SpelForm>>(cloneDeep(DEFAULT_FORM_DATA))
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
  componentName: undefined,
  methodName: undefined,
  methodParams: undefined,
  viewSpel: undefined,
  status: "0"
} as SpelQuery)
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
    const { rows, total } = await getWorkflowSpelListApi({
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
async function handleDelete(row: SpelForm | SpelForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.id)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.componentName}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delWorkflowSpelApi(deleteIds)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}
// #endregion

// #region 弹窗操作
/**
 * 统一处理数据弹窗
 *
 * @param type 操作类型,支持 "add"(新增)、"edit"(编辑)、"show"(查看)
 * @param row 可选参数,编辑或查看时传入对应的菜单项
 */
async function handleOpenDialog(type: "add" | "edit" | "show", row?: SpelForm) {
  dialog.visible = true
  dialog.isEditable = type !== "show"
  dialog.title = { add: "新增", edit: "修改", show: "查看" }[type]

  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  if ((type === "edit" || type === "show") && row) {
    dialog.loading = true
    try {
      const { data } = await getWorkflowSpelApi(row.id)
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
  await getTableData()
  loading.value = false
})
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="componentName" label="组件名称">
          <el-input v-model="searchData.componentName" placeholder="请输入组件名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="methodName" label="方法名称">
          <el-input v-model="searchData.methodName" placeholder="请输入方法名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="status" label="操作状态">
          <el-select class="min-w-[150px]" v-model="searchData.status" placeholder="操作状态" clearable>
            <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
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
    <SpelTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @open-add-dialog="handleOpenDialog('add')"
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
                <el-dropdown-item @click="handleOpenDialog('edit', scope.row)" v-if="checkPermission(['workflow:spel:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['workflow:spel:remove'])">
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
    </SpelTable>

    <!-- 数据弹窗 -->
    <SpelDialog
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
