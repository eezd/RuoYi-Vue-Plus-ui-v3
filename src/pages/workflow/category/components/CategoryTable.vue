<script lang="ts" setup>
import type { CategoryVO } from "@/common/apis/workflow/category/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { formatDateTime } from "@@/utils"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"

interface TableRow extends CategoryVO {
  /** 是否有子分类（用于 el-table 懒加载） */
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
  getTableData: []
}
const openAddDialog = () => emit("openAddDialog")
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()

const tableRef = useTemplateRef("tableRef")

const internalTableData = ref<TableRow[]>([]) // 表格显示的顶层数据
const childrenListMap = ref<Record<string | number, TableRow[]>>({})
const expandMap = ref<Record<string | number, { row: TableRow, treeNode: unknown, resolve: (data: TableRow[]) => void } | undefined>>({})

function setTableData(list: TableRow[]) {
  if (!list || !Array.isArray(list)) return // 增加非空校验
  const tempMap: Record<string | number, TableRow[]> = {}

  // 构建父子映射
  for (const item of list) {
    const parentId = item.parentId
    if (!tempMap[parentId]) {
      tempMap[parentId] = []
    }
    tempMap[parentId].push(item)
  }

  // 标记是否有子节点 (hasChildren)
  const idSet = new Set<string | number>()
  for (const item of list) {
    item.hasChildren = (tempMap[item.categoryId]?.length || 0) > 0
    idSet.add(item.categoryId)
  }

  childrenListMap.value = tempMap
  // 筛选出顶层菜单 (其 parentId 不在当前列表中)
  internalTableData.value = list.filter(item => !idSet.has(item.parentId))
  // 如果有已展开的菜单，尝试刷新它们的数据
  refreshAllExpandData()
}

/** 统一处理懒加载刷新 */
function resolveChildren(id: string | number) {
  const expandInfo = expandMap.value[id]
  if (!expandInfo || !expandInfo.resolve) return

  try {
    const children = childrenListMap.value[id] || []
    if (tableRef.value) {
      const store = (tableRef.value as any).store
      if (store?.states?.lazyTreeNodeMap?.value) {
        // 如果子节点被删光了，同步 UI 状态
        if (children.length === 0) {
          store.states.lazyTreeNodeMap.value[id] = []
        }
      }
    }
    expandInfo.resolve(children)
  } catch {
  }
}

function load(row: TableRow, treeNode: unknown, resolve: (data: TableRow[]) => void) {
  expandMap.value[row.categoryId] = { row, treeNode, resolve }
  resolve(childrenListMap.value[row.categoryId] || [])
}

/** 展开/收起监听 */
function onExpandChange(row: TableRow, expanded: boolean) {
  if (!expanded) {
    expandMap.value[row.categoryId] = undefined
  }
}

/** 刷新所有展开的节点 (供内部使用) */
function refreshAllExpandData() {
  // 只获取那些有实际值的 key 进行遍历
  Object.keys(expandMap.value).forEach((id) => {
    if (expandMap.value[id]) {
      resolveChildren(id)
    }
  })
}

defineExpose({
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
          v-hasPermi="['workflow:category:add']"
          @click="openAddDialog()"
        >
          新增分类
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
        ref="tableRef"
        :data="internalTableData"
        row-key="categoryId"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        lazy
        :load="load"
        @expand-change="onExpandChange"
      >
        <el-table-column prop="categoryName" label="分类名称" min-width="200" />
        <el-table-column prop="orderNum" label="排序" align="center" min-width="80" />
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
