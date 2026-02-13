<script lang="ts" setup>
import type { MenuVO } from "@/common/apis/system/menu/types"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { formatDateTime } from "@@/utils"
import { CirclePlus, Delete, RefreshRight } from "@element-plus/icons-vue"

interface MenuTableRow extends MenuVO {
  /** 是否有子菜单（用于 el-table 懒加载） */
  hasChildren?: boolean
}

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  openCascadeDeleteDialog: []
  getTableData: []
}
const openAddDialog = () => emit("openAddDialog")
const openCascadeDeleteDialog = () => emit("openCascadeDeleteDialog")
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const menuTableRef = useTemplateRef("menuTableRef")

const internalTableData = ref<MenuTableRow[]>([]) // 表格显示的顶层数据
const menuChildrenListMap = ref<Record<string | number, MenuTableRow[]>>({})
const menuExpandMap = ref<Record<string | number, { row: MenuTableRow, treeNode: unknown, resolve: (data: MenuTableRow[]) => void } | undefined>>({})

function setTableData(list: MenuTableRow[]) {
  const tempMap: Record<string | number, MenuTableRow[]> = {}

  // 构建父子映射
  for (const menu of list) {
    const parentId = menu.parentId
    if (!tempMap[parentId]) {
      tempMap[parentId] = []
    }
    tempMap[parentId].push(menu)
  }

  // 标记是否有子节点 (hasChildren)
  const menuIdSet = new Set<string | number>()
  for (const menu of list) {
    menu.hasChildren = (tempMap[menu.menuId]?.length || 0) > 0
    menuIdSet.add(menu.menuId)
  }

  menuChildrenListMap.value = tempMap
  // 筛选出顶层菜单 (其 parentId 不在当前列表中)
  internalTableData.value = list.filter(menu => !menuIdSet.has(menu.parentId))
  // 如果有已展开的菜单，尝试刷新它们的数据
  refreshAllExpandMenuData()
}

/** 统一处理懒加载刷新 */
function resolveChildren(menuId: string | number) {
  const expandInfo = menuExpandMap.value[menuId]
  if (expandInfo) {
    const children = menuChildrenListMap.value[menuId] || []
    // 处理子节点被删光后的 UI 状态同步
    if (children.length === 0 && menuTableRef.value) {
      const store = (menuTableRef.value as any).store
      if (store) store.states.lazyTreeNodeMap.value[menuId] = []
    }
    expandInfo.resolve(children)
  }
}

function load(row: MenuTableRow, treeNode: unknown, resolve: (data: MenuTableRow[]) => void) {
  menuExpandMap.value[row.menuId] = { row, treeNode, resolve }
  resolve(menuChildrenListMap.value[row.menuId] || [])
}

/** 展开/收起监听 */
function onExpandChange(row: MenuTableRow, expanded: boolean) {
  if (!expanded) {
    menuExpandMap.value[row.menuId] = undefined
  }
}

/** 刷新所有展开的节点 (供内部使用) */
function refreshAllExpandMenuData() {
  Object.keys(menuExpandMap.value).forEach(resolveChildren)
}

defineExpose({
  menuTableRef,
  setTableData
})
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :class="{ 'toolbar-buttons-mobile': isMobile }">
        <el-button
          type="primary"
          :icon="CirclePlus"
          v-hasPermi="['system:menu:add']"
          @click="openAddDialog()"
        >
          新增菜单
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          v-hasPermi="['system:menu:remove']"
          @click="openCascadeDeleteDialog()"
        >
          级联删除
        </el-button>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="() => getTableData()" />
        </el-tooltip>
      </div>
    </div>
    <div class="table-wrapper">
      <el-table
        ref="menuTableRef"
        :data="internalTableData"
        row-key="menuId"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        lazy
        :load="load"
        @expand-change="onExpandChange"
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="200" />
        <el-table-column prop="icon" label="图标" align="center" width="100">
          <template #default="scope">
            <SvgIcon :name="scope.row.icon || ''" />
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" align="center" min-width="80" />
        <el-table-column prop="perms" label="权限标识" align="center" min-width="200" :show-overflow-tooltip="true" />
        <el-table-column prop="component" label="组件路径" align="center" min-width="200" :show-overflow-tooltip="true" />
        <el-table-column prop="status" label="状态" min-width="80" align="center">
          <template #default="scope">
            <DictTag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" :width="isMobile ? 100 : 130" align="center">
          <template #default="scope">
            <slot name="operation" :scope="scope" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.toolbar-buttons-mobile {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.table-wrapper {
  margin-bottom: 20px;
}
</style>
