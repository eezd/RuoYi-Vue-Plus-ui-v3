<script lang="ts" setup>
import type { TreeVO } from "@/common/apis/system/demo-tree/types.ts"
import { useDevice } from "@@/composables/useDevice.ts"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"

interface TreeTableRow extends TreeVO {
  /** 是否有子节点（用于 el-table 懒加载） */
  hasChildren?: boolean
}

type KeyType = string | number | null | undefined

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

const tableRef = ref<any>(null)

const internalTableData = ref<TreeTableRow[]>([]) // 表格显示的顶层数据
const childrenListMap = ref<Record<string, TreeTableRow[]>>({})
const expandMap = ref<Record<string, { row: TreeTableRow, treeNode: unknown, resolve: (data: TreeTableRow[]) => void } | undefined>>({})

function toKey(value: KeyType): string {
  if (value === null || value === undefined) return "__root__"
  return String(value)
}

function setTableData(list: TreeTableRow[]) {
  if (!list || !Array.isArray(list)) return
  const tempMap: Record<string, TreeTableRow[]> = {}

  // 构建父子映射
  for (const item of list) {
    const parentKey = toKey(item.parentId as KeyType)
    if (!tempMap[parentKey]) {
      tempMap[parentKey] = []
    }
    tempMap[parentKey].push(item)
  }

  // 标记是否有子节点
  const idSet = new Set<string>()
  for (const item of list) {
    const idKey = toKey(item.id as KeyType)
    item.hasChildren = (tempMap[idKey]?.length || 0) > 0
    idSet.add(idKey)
  }

  childrenListMap.value = tempMap
  // 过滤顶层节点：父节点不在当前 id 集合中
  internalTableData.value = list.filter(item => !idSet.has(toKey(item.parentId as KeyType)))
  // 如果有已展开的节点，尝试刷新其数据
  refreshAllExpandData()
}

/** 统一处理懒加载刷新 */
function resolveChildren(key: string) {
  const expandInfo = expandMap.value[key]
  if (!expandInfo || !expandInfo.resolve) return

  try {
    const children = childrenListMap.value[key] || []
    if (tableRef.value) {
      const store = (tableRef.value as any).store
      if (store?.states?.lazyTreeNodeMap?.value && children.length === 0) {
        store.states.lazyTreeNodeMap.value[key] = []
      }
    }
    expandInfo.resolve(children)
  } catch {
  }
}

function load(row: TreeTableRow, treeNode: unknown, resolve: (data: TreeTableRow[]) => void) {
  const key = toKey(row.id as KeyType)
  expandMap.value[key] = { row, treeNode, resolve }
  resolve(childrenListMap.value[key] || [])
}

/** 展开/收起监听 */
function onExpandChange(row: TreeTableRow, expanded: boolean) {
  if (!expanded) {
    expandMap.value[toKey(row.id as KeyType)] = undefined
  }
}

/** 刷新所有展开节点（供内部使用） */
function refreshAllExpandData() {
  Object.keys(expandMap.value).forEach((key) => {
    if (expandMap.value[key]) {
      resolveChildren(key)
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
          v-hasPermi="['demo:tree:add']"
          @click="openAddDialog()"
        >
          新增
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
        row-key="id"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        lazy
        :load="load"
        @expand-change="onExpandChange"
      >
        <el-table-column prop="id" label="id" align="center" />
        <el-table-column prop="parentId" label="父id" align="center" />
        <el-table-column prop="deptId" label="部门id" align="center" />
        <el-table-column prop="userId" label="用户id" align="center" />
        <el-table-column prop="treeName" label="值" align="center" />
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
