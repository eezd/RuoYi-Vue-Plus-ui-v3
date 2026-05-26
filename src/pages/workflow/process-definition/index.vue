<script lang="ts" setup>
import type { ElMessageBoxOptions, TabsPaneContext } from "element-plus"
import type { CategoryTreeVO } from "@/common/apis/workflow/category/types"
import type { FlowDefinitionForm, FlowDefinitionQuery, FlowDefinitionVO } from "@/common/apis/workflow/definition/types"
import { usePagination } from "@@/composables/usePagination.ts"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { getWorkflowCategoryTreeApi } from "@/common/apis/workflow/category"
import { copyWorkflowDefinitionApi, deleteWorkflowDefinitionApi, getWorkflowDefinitionInfoApi, getWorkflowDefinitionListApi, publishWorkflowDefinitionApi, unWorkflowDefinitionPublishListApi } from "@/common/apis/workflow/definition"
import FlowDefinitionDialog from "./components/FlowDefinitionDialog.vue"
import FlowDefinitionTable from "./components/FlowDefinitionTable.vue"

defineOptions({
  name: "AdminWorkflowProcessDefinition"
})

const router = useRouter()
const route = useRoute()
const loading = ref(true)

// 表格数据
const tableData = ref<FlowDefinitionVO[]>([])
const DEFAULT_FORM_DATA: Partial<FlowDefinitionForm> = {
  id: "",
  flowName: "",
  flowCode: "",
  category: "",
  ext: "",
  formPath: "",
  formCustom: "",
  modelValue: ""
}
// 表单数据
const formData = ref<Partial<FlowDefinitionForm>>(cloneDeep(DEFAULT_FORM_DATA))

const dialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 表单 tab 切换
const activeName = ref("0")
// eslint-disable-next-line unused-imports/no-unused-vars
function handleTabClick(tab: TabsPaneContext, event: Event) {
  // v-model处理有延迟 需要手动处理
  activeName.value = String(tab.paneName || tab.index || "0")
  getTableData()
}

// #region 搜索栏
const searchData = reactive({
  flowName: undefined,
  flowCode: undefined,
  category: undefined
} as FlowDefinitionQuery)
const searchFormRef = useTemplateRef("searchFormRef")

async function resetSearch() {
  searchFormRef.value?.resetFields()
  await getTableData()
}
// #endregion

// #region 表单操作
/**
 * 获取数据
 */
async function getTableData(): Promise<void> {
  try {
    loading.value = true
    const targetApi = activeName.value === "0" ? getWorkflowDefinitionListApi : unWorkflowDefinitionPublishListApi
    const { rows, total } = await targetApi({
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
async function handleDelete(row: FlowDefinitionVO | FlowDefinitionVO[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.id)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.flowName}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await deleteWorkflowDefinitionApi(deleteIds)
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
 * @param row 可选参数,编辑或查看时传入对应的用户项
 */
async function handleOpenDialog(type: "add" | "edit" | "show", row?: FlowDefinitionForm) {
  dialog.visible = true
  dialog.isEditable = type !== "show"
  dialog.title = { add: "新增流程定义", edit: "修改流程定义", show: "查看流程定义" }[type]

  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  if ((type === "edit" || type === "show") && row) {
    dialog.loading = true
    try {
      const { data } = await getWorkflowDefinitionInfoApi(row.id)
      formData.value = data as FlowDefinitionVO
    } finally {
      dialog.loading = false
    }
  } else {
    // 新增
    formData.value.modelValue = "CLASSICS"
    formData.value.formCustom = "N"
  }
}

/** 发布流程定义 */
async function handlePublish(row: FlowDefinitionVO) {
  await ElMessageBox.confirm(`是否确认发布流程定义编码为【${row.flowCode}】版本为【${row.version}】的数据项？，发布后会将已发布流程定义改为失效！`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  } as ElMessageBoxOptions)

  loading.value = true
  await publishWorkflowDefinitionApi(row.id).finally(() => (loading.value = false))
  // processDefinitionDialog.visible = false;
  activeName.value = "0"
  await getTableData()
  ElMessage.success("发布成功")
}

/** 复制流程定义 */
async function handleCopyDef(row: FlowDefinitionVO) {
  ElMessageBox.confirm(`是否确认复制【${row.flowCode}】版本为【${row.version}】的流程定义！`, "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  } as ElMessageBoxOptions).then(() => {
    loading.value = true
    copyWorkflowDefinitionApi(row.id)
      .then((resp: any) => {
        if (resp.code === 200) {
          ElMessage.success("操作成功")
          activeName.value = "1"
          getTableData()
        }
      })
      .finally(() => (loading.value = false))
  })
}

/**
 * 设计流程
 * @param row
 */
async function design(row: FlowDefinitionVO) {
  router.push({
    path: "/workflow/design/index",
    query: {
      definitionId: row.id,
      disabled: "false",
      activeName: activeName.value
    }
  })
}

/**
 * 查看流程
 * @param row
 */
async function designView(row: FlowDefinitionVO) {
  router.push({
    path: "/workflow/design/index",
    query: {
      definitionId: row.id,
      disabled: "true",
      activeName: activeName.value
    }
  })
}

// #endregion

// #region 左侧树
// 默认流程分类名
const categoryName = ref("")
// 流程分类选项
const treeOptions = ref<CategoryTreeVO[]>([])

const treeRef = useTemplateRef("treeRef")

/** 查询树结构 */
async function getCategoryTree() {
  const res = await getWorkflowCategoryTreeApi()
  treeOptions.value = res.data
}

/** 通过条件过滤节点  */
function filterNode(value: string, data: any) {
  if (!value) return true
  return data.label.includes(value)
}

/** 节点单击事件 */
function handleNodeClick(data: CategoryTreeVO) {
  const nodeId = String(data.id)
  searchData.category = nodeId === "ALL" || nodeId === "0" ? undefined : nodeId
  getTableData()
}

/** 根据名称筛选树 */
watchEffect(
  () => {
    treeRef.value?.filter(categoryName.value)
  },
  {
    flush: "post" // watchEffect会在DOM挂载或者更新之前就会触发，此属性控制在DOM元素更新后运行
  }
)
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
  const queryActiveName = route.query.activeName
  if (queryActiveName === "0" || queryActiveName === "1") {
    activeName.value = queryActiveName
  }
  await getCategoryTree()
  await getTableData()
  loading.value = false
})
</script>

<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 树 -->
      <el-col :lg="4" :xs="24" style="">
        <el-card shadow="hover">
          <el-input v-model="categoryName" placeholder="请输入流程分类名称" prefix-icon="Search" clearable />
          <el-tree
            ref="treeRef"
            class="mt-2"
            node-key="id"
            :data="treeOptions"
            :props="{ label: 'label', children: 'children' } "
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            highlight-current
            default-expand-all
            @node-click="handleNodeClick"
          />
        </el-card>
      </el-col>
      <el-col :lg="20" :xs="24">
        <!-- 查询表单 -->
        <el-card v-loading="loading" shadow="never" class="search-wrapper">
          <el-form ref="searchFormRef" :inline="true" :model="searchData">
            <el-form-item prop="flowName" label="流程定义名称">
              <el-input v-model="searchData.flowName" placeholder="请输入流程定义名称" @keyup.enter="getTableData" />
            </el-form-item>
            <el-form-item prop="flowCode" label="流程定义编码">
              <el-input v-model="searchData.flowCode" placeholder="请输入流程定义编码" @keyup.enter="getTableData" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="getTableData()">
                查询
              </el-button>
              <el-button :icon="Refresh" @click="resetSearch">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 表格 -->
        <FlowDefinitionTable
          v-model:loading="loading"
          v-model:table-data="tableData"
          v-model:pagination-data="paginationData"
          v-model:active-name="activeName"
          :tree-options="treeOptions"
          @open-add-dialog="handleOpenDialog('add')"
          @get-table-data="getTableData"
          @handle-delete="handleDelete"
          @handle-current-change="handleCurrentChange"
          @handle-size-change="handleSizeChange"
          @handle-tab-click="handleTabClick"
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
                    <el-dropdown-item @click="handleOpenDialog('edit', scope.row)">
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
                    <el-dropdown-item @click="handleCopyDef(scope.row)">
                      <el-icon color="#67C23A">
                        <Key />
                      </el-icon>
                      复制流程
                    </el-dropdown-item>
                    <el-dropdown-item v-if="scope.row.isPublish === 0" @click="design(scope.row)">
                      <el-icon color="#67C23A">
                        <Edit />
                      </el-icon>
                      流程设计
                    </el-dropdown-item>
                    <el-dropdown-item v-else @click="designView(scope.row)">
                      <el-icon color="#909399">
                        <View />
                      </el-icon>
                      查看流程
                    </el-dropdown-item>
                    <el-dropdown-item v-if="scope.row.isPublish !== 1" @click="handlePublish(scope.row)">
                      <el-icon color="#67C23A">
                        <CircleCheck />
                      </el-icon>
                      发布流程
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </FlowDefinitionTable>
      </el-col>

      <!-- 数据弹窗 -->
      <FlowDefinitionDialog
        v-model:dialog="dialog"
        v-model:form-data="formData"
        v-model:active-name="activeName"
        :tree-options="treeOptions"
        @success="getTableData"
      />
    </el-row>
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
