<script lang="ts" setup>
import type { DeptForm, DeptQuery, DeptVO } from "@/common/apis/system/dept/types"
import { useDict } from "@@/composables/useDict.ts"
import { handleTree } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { delSysDeptApi, getSysDeptApi, getSysDeptListApi } from "@/common/apis/system/dept"
import DeptDialog from "./components/DeptDialog.vue"
import DeptTable from "./components/DeptTable.vue"

defineOptions({
  name: "AdminSysDept"
})

export interface DeptOptionsType {
  deptId: number | string
  deptName: string
  children: DeptOptionsType[] | undefined
}

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const loading = ref(true)

const tableComponentRef = useTemplateRef("tableComponentRef")

// 表格数据
const treeData = ref<DeptOptionsType[]>([])

const DEFAULT_FORM_DATA: Partial<DeptForm> = {
  deptId: undefined,
  parentId: undefined,
  deptName: undefined,
  deptCategory: undefined,
  orderNum: 0,
  leader: undefined,
  phone: undefined,
  email: undefined,
  status: "0"
}
// 表单数据
const formData = ref<Partial<DeptForm>>(cloneDeep(DEFAULT_FORM_DATA))
const dialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// #region 搜索栏
const searchData = reactive({
  deptName: undefined,
  deptCategory: undefined,
  status: undefined
} as DeptQuery)
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
    const res = await getSysDeptListApi(searchData)
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
  const response = await getSysDeptListApi()
  treeData.value = handleTree<DeptOptionsType>(response.data, "deptId")
}

/**
 * 删除
 */
async function handleDelete(row: DeptForm) {
  if (!row.deptId) {
    ElMessage.error("id为空")
    return
  }
  const message = `正在删除：${row.deptName}，确认删除？`
  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysDeptApi(row.deptId)
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
 * @param type 操作类型,支持 "add"(新增)、"edit"(编辑)、"show"(查看)、"sub"(新增子菜单)
 * @param row 可选参数,编辑或查看时传入对应的菜单项
 */
async function handleOpenDialog(type: "add" | "edit" | "show" | "sub", row?: DeptVO) {
  dialog.visible = true
  dialog.isEditable = type !== "show"
  dialog.title = { add: "新增菜单", edit: "修改菜单", show: "查看菜单", sub: "新增子菜单" }[type]

  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  if ((type === "edit" || type === "show") && row) {
    dialog.loading = true
    try {
      const { data } = await getSysDeptApi(row.deptId)
      formData.value = data as DeptForm
    } finally {
      dialog.loading = false
    }
  } else if (type === "sub" && row) {
    formData.value.parentId = row.deptId
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
        <el-form-item prop="deptName" label="部门名称">
          <el-input v-model="searchData.deptName" placeholder="请输入部门名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="deptCategory" label="类别编码">
          <el-input v-model="searchData.deptCategory" placeholder="请输入类别编码" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select class="min-w-[150px]" v-model="searchData.status" placeholder="请输入状态" clearable>
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
    <DeptTable
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
                <el-dropdown-item @click="handleOpenDialog('sub', scope.row)" v-if="checkPermission(['system:dept:add'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  新增子菜单
                </el-dropdown-item>
                <el-dropdown-item @click="handleOpenDialog('edit', scope.row)" v-if="checkPermission(['system:dept:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['system:dept:remove'])">
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
    </DeptTable>

    <!-- 数据弹窗 -->
    <DeptDialog
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
