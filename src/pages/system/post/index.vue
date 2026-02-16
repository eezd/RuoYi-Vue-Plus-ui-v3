<script lang="ts" setup>
import type { DeptTreeVO, DeptVO } from "@/common/apis/system/dept/types"
import type { PostForm, PostQuery, PostVO } from "@/common/apis/system/post/types"
import { useDict } from "@@/composables/useDict.ts"
import { usePagination } from "@@/composables/usePagination.ts"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { delSysPostApi, getSysPostApi, getSysPostListApi } from "@/common/apis/system/post"
import { getSysDeptTreeSelectApi } from "@/common/apis/system/user"
import { download } from "@/http/download"
import PostDialog from "./components/PostDialog.vue"
import PostTable from "./components/PostTable.vue"

defineOptions({
  name: "AdminSysPost"
})

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const loading = ref(true)

// 表格数据
const tableData = ref<PostVO[]>([])
const DEFAULT_FORM_DATA: Partial<PostForm> = {
  postId: undefined,
  deptId: undefined,
  postCode: "",
  postName: "",
  postCategory: "",
  postSort: 0,
  status: "0",
  remark: ""
}
// 表单数据
const formData = ref<Partial<PostForm>>(cloneDeep(DEFAULT_FORM_DATA))

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
  deptId: undefined,
  belongDeptId: undefined,
  postCode: "",
  postName: "",
  postCategory: "",
  status: ""
} as PostQuery)
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
    const { rows, total } = await getSysPostListApi({
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
async function handleDelete(row: PostForm | PostForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.postId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.postName}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysPostApi(deleteIds)
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
    "/system/post/export",
    { ...searchData },
    `post_${timestamp}.xlsx`
  )
}

// #endregion

// #region 弹窗操作
/**
 * 统一处理数据弹窗
 *
 * @param type 操作类型,支持 "add"(新增)、"edit"(编辑)、"show"(查看)
 * @param row 可选参数,编辑或查看时传入对应的用户项
 */
async function handleOpenDialog(type: "add" | "edit" | "show", row?: PostForm) {
  dialog.visible = true
  dialog.isEditable = type !== "show"
  dialog.title = { add: "新增", edit: "修改", show: "查看" }[type]

  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  dialog.loading = true
  try {
    if ((type === "edit" || type === "show") && row) {
      const postId = row.postId
      const { data } = await getSysPostApi(postId)
      Object.assign(formData.value, data)
    }
  } finally {
    dialog.loading = false
  }
}
// #endregion

// #region 左侧部门树
// 默认部门名
const deptName = ref("")
// 部门选项
const deptOptions = ref<DeptTreeVO[]>([])
// 部门数据展示
const enabledDeptOptions = ref<DeptTreeVO[]>([])

const deptTreeRef = useTemplateRef("deptTreeRef")

/** 查询部门下拉树结构 */
async function getDeptTree() {
  const res = await getSysDeptTreeSelectApi()
  deptOptions.value = res.data
  enabledDeptOptions.value = filterDisabledDept(res.data)
}
/** 过滤禁用的部门 */
function filterDisabledDept(deptList: DeptTreeVO[]) {
  return deptList.filter((dept) => {
    if (dept.disabled) {
      return false
    }
    if (dept.children && dept.children.length) {
      dept.children = filterDisabledDept(dept.children)
    }
    return true
  })
}

/** 通过条件过滤节点  */
function filterNode(value: string, data: any) {
  if (!value) return true
  return data.label.includes(value)
}

/** 节点单击事件 */
function handleNodeClick(data: DeptVO) {
  searchData.deptId = data.id
  getTableData()
}

/** 根据名称筛选部门树 */
watchEffect(
  () => {
    deptTreeRef.value?.filter(deptName.value)
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
  await getDeptTree()
  await getTableData()
  loading.value = false
})
</script>

<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 部门树 -->
      <el-col :lg="4" :xs="24" style="">
        <el-card shadow="hover">
          <el-input v-model="deptName" placeholder="请输入部门名称" prefix-icon="Search" clearable />
          <el-tree
            ref="deptTreeRef"
            class="mt-2"
            node-key="id"
            :data="deptOptions"
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
            <el-form-item prop="postCode" label="岗位编码">
              <el-input v-model="searchData.postCode" placeholder="请输入岗位编码" @keyup.enter="getTableData" />
            </el-form-item>
            <el-form-item prop="postCategory" label="类别编码">
              <el-input v-model="searchData.postCategory" placeholder="请输入类别编码" @keyup.enter="getTableData" />
            </el-form-item>
            <el-form-item prop="postName" label="岗位名称">
              <el-input v-model="searchData.postName" placeholder="请输入岗位名称" @keyup.enter="getTableData" />
            </el-form-item>
            <el-form-item prop="deptId" label="部门" class="min-w-[200px]">
              <el-tree-select
                v-model="searchData.deptId"
                :data="deptOptions"
                :props="{ value: 'id', label: 'label', children: 'children' }"
                value-key="id"
                placeholder="请选择部门"
                check-strictly
              />
            </el-form-item>
            <el-form-item prop="status" label="状态">
              <el-select class="min-w-[100px]" v-model="searchData.status" placeholder="状态" clearable>
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
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
        <PostTable
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
                    <el-dropdown-item @click="handleOpenDialog('edit', scope.row)" v-if="checkPermission(['system:post:edit'])">
                      <el-icon color="#409EFF">
                        <edit />
                      </el-icon>
                      修改
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['system:post:remove'])">
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
        </PostTable>
      </el-col>

      <!-- 数据弹窗 -->
      <PostDialog
        v-model:dialog="dialog"
        v-model:form-data="formData"
        v-model:dept-options="deptOptions"
        :enabled-dept-options="enabledDeptOptions"
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
