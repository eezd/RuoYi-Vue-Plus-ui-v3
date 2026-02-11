<script lang="ts" setup>
import type { RoleVO } from "@@/apis/admin/system/role/types.ts"
import type { UserForm } from "@@/apis/admin/system/user/types.ts"
import type { ElTable } from "element-plus"
import { getAuthRoleApi, updateAuthRoleApi } from "@@/apis/admin/system/user"
import { usePagination } from "@@/composables/usePagination.ts"
import { formatDateTime } from "@@/utils"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { nextTick, onMounted, ref, watch } from "vue"
import { useTagsViewStore } from "@/pinia/stores/tags-view.ts"

defineOptions({
  name: "AdminSysUserAuthRole"
})

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()

const loading = ref(true)

const tableRef = ref<InstanceType<typeof ElTable> | null>(null)

// 所有的角色数据（从后端获取的完整列表）
const allRoles = ref<RoleVO[]>([])
// 当前页显示的数据
const tableData = ref<RoleVO[]>([])
// 表单数据 保存用户信息
const formData = ref<Partial<UserForm>>(cloneDeep({}))

// 核心：使用 Set 维护所有选中的 RoleID
const roleIds = ref<Set<string | number>>(new Set())

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

/** 获取 Row Key */
function getRowKey(row: RoleVO) {
  return String(row.roleId)
}
/** 检查行是否可选 */
function checkSelectable(row: RoleVO): boolean {
  return row.status === "0" // 只有状态为0的才可选
}

function clickRow(row: RoleVO) {
  if (!checkSelectable(row)) return
  const isSelected = roleIds.value.has(row.roleId)
  if (isSelected) {
    roleIds.value.delete(row.roleId)
  } else {
    roleIds.value.add(row.roleId)
  }
  // 注意：第二个参数是希望变成的状态，所以取反
  tableRef.value?.toggleRowSelection(row, !isSelected)
}

/**
 * 手动点击复选框事件
 * selection: 当前页所有已选中的数组
 * row: 当前点击的这一行
 */
function handleSelect(selection: RoleVO[], row: RoleVO) {
  // 判断当前点击的行是在选中数组中(选中操作)，还是不在(取消操作)
  const isChecked = selection.some(item => item.roleId === row.roleId)
  if (isChecked) {
    roleIds.value.add(row.roleId)
  } else {
    roleIds.value.delete(row.roleId)
  }
}

/**
 * 点击全选/取消全选事件
 */
function handleSelectAll(selection: RoleVO[]) {
  const isAllSelected = selection.length > 0
  tableData.value.forEach((row) => {
    if (!checkSelectable(row)) return

    if (isAllSelected) {
      roleIds.value.add(row.roleId)
    } else {
      roleIds.value.delete(row.roleId)
    }
  })
}

/** 提交表单 */
async function submitForm() {
  loading.value = true
  const userId = formData.value.userId
  const rIds = Array.from(roleIds.value).join(",")

  try {
    await updateAuthRoleApi({ userId: userId as string, roleIds: rIds })
    ElMessage.success("授权成功")
    close()
  } catch {
  } finally {
    loading.value = false
  }
}

function close() {
  tagsViewStore.delVisitedView(router.currentRoute.value)
  router.back()
}

/** 获取初始数据 */
async function getTableData(): Promise<void> {
  const userId = route.params && route.params.userId
  if (userId) {
    try {
      loading.value = true
      const { data } = await getAuthRoleApi(userId as string)
      Object.assign(formData.value, data.user)

      // 保存完整数据
      allRoles.value = data.roles || []

      // 初始化选中的角色ID（根据后端返回的 flag）
      roleIds.value.clear()
      allRoles.value.forEach((role) => {
        if (role.flag && checkSelectable(role)) {
          roleIds.value.add(role.roleId)
        }
      })

      paginationData.total = allRoles.value.length

      // 初始化分页显示
      await handlePagination()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }
}

/** 处理分页逻辑（核心回显逻辑） */
async function handlePagination() {
  // 1. 切割数据
  const startIndex = (paginationData.currentPage - 1) * paginationData.pageSize
  const endIndex = startIndex + paginationData.pageSize
  tableData.value = allRoles.value.slice(startIndex, endIndex)

  // 2. 数据渲染后，根据 roleIds 恢复选中状态
  await nextTick(() => {
    // 先清空当前页的选中状态（防止状态混乱），这一步可选，但在某些复杂场景下更安全
    // tableRef.value?.clearSelection()
    tableData.value.forEach((row) => {
      if (roleIds.value.has(row.roleId)) {
        tableRef.value?.toggleRowSelection(row, true)
      }
    })
  })
}

watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    handlePagination()
  }
)

onMounted(() => {
  getTableData()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form :inline="true" :model="formData">
        <el-form-item label="用户昵称">
          <el-input v-model="formData.nickName" disabled />
        </el-form-item>
        <el-form-item label="登录账号">
          <el-input v-model="formData.userName" disabled />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        角色信息
      </div>
      <div style="margin: 10px 0; color: #909399;">
        当前选中 {{ roleIds.size }} 个角色
      </div>

      <div class="table-wrapper">
        <el-table
          ref="tableRef"
          :data="tableData"
          :row-key="getRowKey"
          @row-click="clickRow"
          @select="handleSelect"
          @select-all="handleSelectAll"
        >
          <el-table-column
            type="selection"
            width="50"
            align="center"
            :selectable="checkSelectable"
          />
          <el-table-column prop="roleId" label="角色编号" align="center" min-width="200" />
          <el-table-column prop="roleName" label="角色名称" align="center" min-width="150" />
          <el-table-column prop="roleKey" label="权限字符" align="center" min-width="150" />
          <el-table-column label="创建时间" align="center" min-width="180">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.createTime) }}</span>
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
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <div style="text-align: center; margin-top: 30px">
        <el-button type="primary" @click="submitForm()">
          提交
        </el-button>
        <el-button @click="close()">
          返回
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
}
.pager-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.no-wrap-table :deep(.cell) {
  white-space: nowrap;
}
</style>
