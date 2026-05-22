<script lang="ts" setup>
import type { CategoryForm, CategoryQuery, CategoryVO } from "@/common/apis/workflow/category/types"
import { handleTree } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { delWorkflowCategoryApi, getWorkflowCategoryApi, getWorkflowCategoryListApi } from "@/common/apis/workflow/category"
import CategoryDialog from "./components/CategoryDialog.vue"
import CategoryTable from "./components/CategoryTable.vue"

defineOptions({
  name: "AdminWorkflowCategory"
})

export interface CategoryOptionsType {
  categoryId: number | string
  categoryName: string
  children: CategoryOptionsType[] | undefined
}

const loading = ref(true)

const tableComponentRef = useTemplateRef("tableComponentRef")

// 表格数据
const treeData = ref<CategoryOptionsType[]>([])

const DEFAULT_FORM_DATA: Partial<CategoryForm> = {
  categoryId: undefined,
  categoryName: "",
  parentId: undefined,
  orderNum: 0
}
// 表单数据
const formData = ref<Partial<CategoryForm>>(cloneDeep(DEFAULT_FORM_DATA))
const dialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// #region 搜索栏
const searchData = reactive({
  categoryName: undefined
} as CategoryQuery)
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
    const res = await getWorkflowCategoryListApi(searchData)
    tableComponentRef.value?.setTableData(res.data)
    await getTreeSelect()
  } catch {
    tableComponentRef.value?.setTableData([])
  } finally {
    loading.value = false
  }
}

/** 查询菜单下拉树结构 */
async function getTreeSelect() {
  const response = await getWorkflowCategoryListApi()
  treeData.value = handleTree<CategoryOptionsType>(response.data, "categoryId")
}

/**
 * 删除
 */
async function handleDelete(row: CategoryForm) {
  if (!row.categoryId) {
    ElMessage.error("id为空")
    return
  }
  const message = `正在删除：${row.categoryName}，确认删除？`
  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delWorkflowCategoryApi(row.categoryId)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}
// #endregion

/**
 * 统一处理数据弹窗
 *
 * @param type 操作类型,支持 "add"(新增)、"edit"(编辑)、"show"(查看)、"sub"(新增子分类)
 * @param row 可选参数,编辑或查看时传入对应的菜单项
 */
async function handleOpenDialog(type: "add" | "edit" | "show" | "sub", row?: CategoryVO) {
  dialog.visible = true
  dialog.isEditable = type !== "show"
  dialog.title = { add: "新增分类", edit: "修改分类", show: "查看分类", sub: "新增子分类" }[type]

  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  if ((type === "edit" || type === "show") && row) {
    dialog.loading = true
    try {
      const { data } = await getWorkflowCategoryApi(row.categoryId)
      formData.value = data as CategoryForm
    } finally {
      dialog.loading = false
    }
  } else if (type === "sub" && row) {
    formData.value.parentId = row.categoryId
  }
}

onMounted(async () => {
  await getTableData()
})
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="categoryName" label="分类名称">
          <el-input v-model="searchData.categoryName" placeholder="请输入分类名称" @keyup.enter="getTableData" />
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
    <CategoryTable
      ref="tableComponentRef"
      v-model:loading="loading"
      @open-add-dialog="handleOpenDialog('add')"
      @get-table-data="getTableData"
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
                <el-dropdown-item @click="handleOpenDialog('sub', scope.row)" v-if="checkPermission(['workflow:category:add'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  新增子分类
                </el-dropdown-item>
                <el-dropdown-item @click="handleOpenDialog('edit', scope.row)" v-if="checkPermission(['workflow:category:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['workflow:category:remove'])">
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
    </CategoryTable>

    <!-- 数据弹窗 -->
    <CategoryDialog
      v-model:dialog="dialog"
      v-model:form-data="formData"
      v-model:tree-data="treeData"
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
