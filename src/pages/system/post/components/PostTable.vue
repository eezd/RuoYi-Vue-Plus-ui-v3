<script lang="ts" setup>
import type { PaginationData } from "@@/composables/usePagination.ts"
import type { PostVO } from "@/common/apis/system/post/types"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { formatDateTime } from "@@/utils"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<PostVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  handleDelete: [rows: PostVO[]]
  handleExport: []
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const openAddDialog = () => emit("openAddDialog")
const handleDelete = (rows: PostVO[]) => emit("handleDelete", rows)
const handleExport = () => emit("handleExport")
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const { isMobile } = useDevice()

const selectedRows = ref<PostVO[]>([])

const handleSelectionChange = (val: PostVO[]) => (selectedRows.value = val)

</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="primary"
          :icon="CirclePlus"
          v-hasPermi="['system:post:add']"
          @click="openAddDialog()"
        >
          新增
        </el-button>
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length"
          v-hasPermi="['system:post:remove']"
          @click="handleDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="warning" plain icon="Download"
          v-hasPermi="['system:post:export']"
          @click="handleExport()"
        >
          导出
        </el-button>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="() => getTableData()" />
        </el-tooltip>
      </div>
    </div>
    <div class="table-wrapper">
      <el-table :data="tableData" @selection-change="handleSelectionChange" border>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="postCode" label="岗位编码" align="center" />
        <el-table-column prop="postCategory" label="类别编码" align="center" />
        <el-table-column prop="postName" label="岗位名称" align="center" />
        <el-table-column prop="deptName" label="部门名称" align="center" />
        <el-table-column prop="postSort" label="排序" align="center" />
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
    <div class="pager-wrapper">
      <el-pagination
        background
        :layout="paginationData.layout"
        :page-sizes="paginationData.pageSizes"
        :total="paginationData.total"
        v-model:page-size="paginationData.pageSize"
        v-model:current-page="paginationData.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
