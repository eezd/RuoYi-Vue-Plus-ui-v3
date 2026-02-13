<script lang="ts" setup>
import type { MenuForm, MenuQuery, MenuVO } from "@@/apis/system/menu/types.ts"
import { delSysMenuApi, getSysMenuApi, getSysMenuListApi } from "@@/apis/system/menu"
import { useDict } from "@@/composables/useDict.ts"
import { MenuTypeEnum } from "@@/enums/MenuTypeEnum.ts"
import { handleTree } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import MenuCascadeDeleteDialog from "./components/MenuCascadeDeleteDialog.vue"
import MenuDialog from "./components/MenuDialog.vue"
import MenuTable from "./components/MenuTable.vue"

defineOptions({
  name: "AdminSysMenu"
})

export interface MenuOptionsType {
  menuId: number | string
  menuName: string
  children: MenuOptionsType[] | undefined
}

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const loading = ref(true)

const menuTableComponentRef = useTemplateRef("menuTableComponentRef")

// 表格数据
const menuOptions = ref<MenuOptionsType[]>([])

const DEFAULT_FORM_DATA = {
  path: "",
  menuId: undefined,
  parentId: 0,
  menuName: "",
  icon: "",
  menuType: MenuTypeEnum.M,
  orderNum: 1,
  isFrame: "1",
  isCache: "0",
  visible: "0",
  status: "0"
}
// 表单数据
const formData = ref<Partial<MenuForm>>(cloneDeep(DEFAULT_FORM_DATA))
const dialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// #region 搜索栏
const searchData = reactive({
  menuName: "",
  status: ""
} as MenuQuery)
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
    const res = await getSysMenuListApi(searchData)
    menuTableComponentRef.value?.setTableData(res.data)
    await getTreeSelect()
  } catch {
    menuTableComponentRef.value?.setTableData([])
  } finally {
    loading.value = false
  }
}

/** 查询菜单下拉树结构 */
async function getTreeSelect() {
  menuOptions.value = []
  const response = await getSysMenuListApi()
  const menu: MenuOptionsType = { menuId: 0, menuName: "主类目", children: [] }
  menu.children = handleTree<MenuOptionsType>(response.data, "menuId")
  menuOptions.value.push(menu)
}

/**
 * 删除
 */
async function handleDelete(row: MenuForm) {
  if (!row.menuId) {
    ElMessage.error("id为空")
    return
  }
  const message = `正在删除：${row.menuName}，确认删除？`
  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysMenuApi(row.menuId as any)
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
async function handleOpenDialog(type: "add" | "edit" | "show" | "sub", row?: MenuVO) {
  dialog.visible = true
  dialog.isEditable = type !== "show"
  dialog.title = { add: "新增菜单", edit: "修改菜单", show: "查看菜单", sub: "新增子菜单" }[type]

  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  if ((type === "edit" || type === "show") && row) {
    dialog.loading = true
    try {
      const { data } = await getSysMenuApi(row.menuId)
      formData.value = data as MenuForm
    } finally {
      dialog.loading = false
    }
  } else if (type === "sub" && row) {
    formData.value.parentId = row.menuId
  }
}

// #region 联删除
const menuCascadeDeleteDialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})
/**
 * 打开级联删除弹窗
 */
async function openCascadeDeleteDialog() {
  menuCascadeDeleteDialog.title = "级联删除"
  menuCascadeDeleteDialog.visible = true
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
        <el-form-item prop="menuName" label="菜单名称">
          <el-input v-model="searchData.menuName" placeholder="请输入菜单名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select class="min-w-[150px]" v-model="searchData.status" placeholder="请输入菜单状态" clearable>
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
    <MenuTable
      ref="menuTableComponentRef"
      v-model:loading="loading"
      @open-add-dialog="handleOpenDialog('add')"
      @open-cascade-delete-dialog="openCascadeDeleteDialog"
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
                <el-dropdown-item @click="handleOpenDialog('sub', scope.row)" v-if="checkPermission(['system:menu:add'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  新增子菜单
                </el-dropdown-item>
                <el-dropdown-item @click="handleOpenDialog('edit', scope.row)" v-if="checkPermission(['system:menu:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['system:menu:remove'])">
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
    </MenuTable>

    <!-- 数据弹窗 -->
    <MenuDialog
      v-model:dialog="dialog"
      v-model:form-data="formData"
      v-model:menu-options="menuOptions"
      @success="getTableData"
    />

    <!-- 数据弹窗 -->
    <MenuCascadeDeleteDialog
      v-model:dialog="menuCascadeDeleteDialog"
      v-model:menu-options="menuOptions"
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
