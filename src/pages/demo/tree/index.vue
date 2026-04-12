<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { TreeForm, TreeQuery, TreeVO } from "@/common/apis/system/demo-tree/types.ts"
import { handleTree } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { delSysTreeApi, getSysTreeApi, getSysTreeListApi } from "@/common/apis/system/demo-tree"
import DataDialog from "./components/DataDialog.vue"
import DataTable from "./components/DataTable.vue"

defineOptions({
  name: "AdminSysTree"
})

export interface TreeOptionsType {
  id: number | string
  treeName: string
  children: TreeOptionsType[] | undefined
}

const loading = ref(true)

const tableComponentRef = ref<InstanceType<typeof DataTable> | null>(null)

// 表格数据
const treeData = ref<TreeOptionsType[]>([])

const DEFAULT_FORM_DATA: Partial<TreeForm> = {
  parentId: 0,
  deptId: 0,
  userId: 0,
  treeName: ""
}
// 表单数据
const formData = ref<Partial<TreeForm>>(cloneDeep(DEFAULT_FORM_DATA))
const dialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// #region 搜索相关
const searchData = reactive({
  parentId: undefined,
  deptId: undefined,
  userId: undefined,
  treeName: undefined,
  params: {
    beginTime: undefined,
    endTime: undefined
  }
} as TreeQuery)
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
    const res = await getSysTreeListApi(searchData)
    const list = ((res as any).data ?? (res as any).rows ?? []) as TreeVO[]
    tableComponentRef.value?.setTableData(list)
    await getTreeSelect()
  } catch {
    tableComponentRef.value?.setTableData([])
  } finally {
    loading.value = false
  }
}

/** 查询下拉树结构 */
async function getTreeSelect() {
  const response = await getSysTreeListApi()
  const list = ((response as any).data ?? (response as any).rows ?? []) as TreeOptionsType[]
  treeData.value = handleTree<TreeOptionsType>(list, "id", "parentId")
}

/**
 * 删除
 */
async function handleDelete(row: TreeVO) {
  if (!row.id) {
    ElMessage.error("id 为空")
    return
  }
  const message = `正在删除：${row.treeName}，确认删除？`
  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysTreeApi(row.id)
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
 * @param type 操作类型,支持 "add"(新增)、"edit"(编辑)、"show"(查看)、"sub"(新增子节点)
 * @param row 可选参数, 编辑、查看、新增子节点时传入当前行
 */
async function handleOpenDialog(type: "add" | "edit" | "show" | "sub", row?: TreeVO) {
  dialog.visible = true
  dialog.isEditable = type !== "show"
  dialog.title = { add: "新增", edit: "修改", show: "查看", sub: "新增下级" }[type]

  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  if ((type === "edit" || type === "show") && row) {
    dialog.loading = true
    try {
      const { data } = await getSysTreeApi(row.id)
      Object.assign(formData.value, data)
    } finally {
      dialog.loading = false
    }
  } else if (type === "sub" && row) {
    formData.value.parentId = row.id
  } else if (type === "add") {
    formData.value.parentId = 0
  }
}
// #endregion

onMounted(async () => {
  await getTableData()
})
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="parentId" label="父id">
          <el-input v-model="searchData.parentId" placeholder="请输入父id" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="deptId" label="部门id">
          <el-input v-model="searchData.deptId" placeholder="请输入部门id" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="userId" label="用户id">
          <el-input v-model="searchData.userId" placeholder="请输入用户id" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="treeName" label="值">
          <el-input v-model="searchData.treeName" placeholder="请输入值" @keyup.enter="getTableData" />
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
    <DataTable
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
                <el-dropdown-item @click="handleOpenDialog('sub', scope.row)" v-if="checkPermission(['system:tree:add'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  新增下级
                </el-dropdown-item>
                <el-dropdown-item @click="handleOpenDialog('edit', scope.row)" v-if="checkPermission(['system:tree:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['system:tree:remove'])">
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
    </DataTable>

    <!-- 数据弹窗 -->
    <DataDialog
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
