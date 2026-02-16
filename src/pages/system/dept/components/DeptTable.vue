<script lang="ts" setup>
import type { DeptVO } from "@/common/apis/system/dept/types"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { formatDateTime } from "@@/utils"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"

interface DeptTableRow extends DeptVO {
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

const tableRef = useTemplateRef("tableRef")

const internalTableData = ref<DeptTableRow[]>([]) // 表格显示的顶层数据
const childrenListMap = ref<Record<string | number, DeptTableRow[]>>({})
const expandMap = ref<Record<string | number, { row: DeptTableRow, treeNode: unknown, resolve: (data: DeptTableRow[]) => void } | undefined>>({})

function setTableData(list: DeptTableRow[]) {
  if (!list || !Array.isArray(list)) return // 增加非空校验
  const tempMap: Record<string | number, DeptTableRow[]> = {}

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
    item.hasChildren = (tempMap[item.deptId]?.length || 0) > 0
    idSet.add(item.deptId)
  }

  childrenListMap.value = tempMap
  // 筛选出顶层菜单 (其 parentId 不在当前列表中)
  internalTableData.value = list.filter(item => !idSet.has(item.parentId))
  // 如果有已展开的菜单，尝试刷新它们的数据
  refreshAllExpandData()
}

/** 统一处理懒加载刷新 */
function resolveChildren(deptId: string | number) {
  const expandInfo = expandMap.value[deptId]
  if (!expandInfo || !expandInfo.resolve) return

  try {
    const children = childrenListMap.value[deptId] || []
    if (tableRef.value) {
      const store = (tableRef.value as any).store
      if (store?.states?.lazyTreeNodeMap?.value) {
        // 如果子节点被删光了，同步 UI 状态
        if (children.length === 0) {
          store.states.lazyTreeNodeMap.value[deptId] = []
        }
      }
    }
    expandInfo.resolve(children)
  } catch {
  }
}

function load(row: DeptTableRow, treeNode: unknown, resolve: (data: DeptTableRow[]) => void) {
  expandMap.value[row.deptId] = { row, treeNode, resolve }
  resolve(childrenListMap.value[row.deptId] || [])
}

/** 展开/收起监听 */
function onExpandChange(row: DeptTableRow, expanded: boolean) {
  if (!expanded) {
    expandMap.value[row.deptId] = undefined
  }
}

/** 刷新所有展开的节点 (供内部使用) */
function refreshAllExpandData() {
  // 只获取那些有实际值的 key 进行遍历
  Object.keys(expandMap.value).forEach((deptId) => {
    if (expandMap.value[deptId]) {
      resolveChildren(deptId)
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
          v-hasPermi="['system:dept:add']"
          @click="openAddDialog()"
        >
          新增部门
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
        row-key="deptId"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        lazy
        :load="load"
        @expand-change="onExpandChange"
      >
        <el-table-column prop="deptName" label="部门名称" />
        <el-table-column prop="deptCategory" label="类别编码" align="center" />
        <el-table-column prop="orderNum" label="排序" align="center" />
        <el-table-column prop="status" label="状态" align="center">
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
