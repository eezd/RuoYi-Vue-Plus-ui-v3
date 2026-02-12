<script lang="ts" setup>
import { ElTree } from "element-plus"

// 定义通用的树节点接口，确保有 id 即可
interface TreeOption {
  id: number | string
  [key: string]: any
}

interface Props {
  treeData?: TreeOption[] // 通用数据源
  editable?: boolean
  nodeKey?: string // 节点唯一标识字段，默认 'id'
  props?: { // 树的属性配置
    label: string
    children: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  treeData: () => [],
  editable: true,
  nodeKey: "id",
  props: () => ({ label: "label", children: "children" })
})

// 双向绑定父子联动状态 (checkStrictly)
const checkStrictly = defineModel<boolean>("checkStrictly", { default: true })

const treeRef = ref<InstanceType<typeof ElTree>>()
const isExpanded = ref(false)
const isSelectAll = ref(false)

/** 树权限（展开/折叠） */
function handleCheckedTreeExpand(value: any) {
  const treeList = props.treeData
  for (let i = 0; i < treeList.length; i++) {
    // 使用传入的 nodeKey (默认id) 获取主键
    const key = treeList[i][props.nodeKey]
    if (treeRef.value && treeRef.value.store.nodesMap[key]) {
      treeRef.value.store.nodesMap[key].expanded = value
    }
  }
}

/** 树权限（全选/全不选） */
function handleCheckedTreeNodeAll(value: any) {
  treeRef.value?.setCheckedNodes(value ? (props.treeData as any) : [])
}

/** 树权限（父子联动） */
function handleCheckedTreeConnect(value: any) {
  checkStrictly.value = value
}

/** 获取所有被选中的节点数据 (全选 + 半选) */
function getAllCheckedKeys() {
  const checkedKeys = treeRef.value?.getCheckedKeys()
  const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys()
  if (halfCheckedKeys && checkedKeys) {
    checkedKeys.unshift(...halfCheckedKeys)
  }
  return checkedKeys || []
}

/** 设置回显选中 */
function setCheckedKeys(keys: (number | string)[]) {
  // 重置内部状态
  isExpanded.value = false
  isSelectAll.value = false

  // 清空
  treeRef.value?.setCheckedKeys([])

  // 赋值
  if (keys && keys.length > 0) {
    keys.forEach((v) => {
      nextTick(() => {
        treeRef.value?.setChecked(v, true, false)
      })
    })
  }
}

/** 重置 */
function reset() {
  isExpanded.value = false
  isSelectAll.value = false
  treeRef.value?.setCheckedKeys([])
}

// 暴露方法
defineExpose({
  getAllCheckedKeys,
  setCheckedKeys,
  reset
})
</script>

<template>
  <div class="flex-col">
    <div>
      <el-checkbox
        v-model="isExpanded"
        @change="handleCheckedTreeExpand"
        :disabled="!editable"
      >
        展开/折叠
      </el-checkbox>
      <el-checkbox
        v-model="isSelectAll"
        @change="handleCheckedTreeNodeAll"
        :disabled="!editable"
      >
        全选/全不选
      </el-checkbox>
      <el-checkbox
        v-model="checkStrictly"
        @change="handleCheckedTreeConnect"
        :disabled="!editable"
      >
        父子联动
      </el-checkbox>
    </div>
    <ElTree
      ref="treeRef"
      class="tree-border"
      :data="treeData"
      show-checkbox
      :node-key="nodeKey"
      :check-strictly="!checkStrictly"
      empty-text="加载中，请稍候"
      :props="props.props"
    />
  </div>
</template>

<style scoped>
.tree-border {
  margin-top: 5px;
  border: 1px solid #e5e6e7;
  background: #ffffff none;
  border-radius: 4px;
  width: 100%;
}
</style>
