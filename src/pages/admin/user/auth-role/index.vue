<script lang="ts" setup>
import type { RoleVO } from "@/common/apis/admin/role/types"
import type { UserForm } from "@/common/apis/admin/user/types"
import { usePagination } from "@@/composables/usePagination"
import { formatDateTime } from "@@/utils/index"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"

import { getAuthRoleApi, updateAuthRoleApi } from "@/common/apis/admin/user"
import { useTagsViewStore } from "@/pinia/stores/tags-view"

defineOptions({
  name: "AdminSysUserAuthRole"
})

const route = useRoute()
const router = useRouter()

const loading = ref(true)

// 表格数据
const tableData = ref<RoleVO[]>([])

// 表单数据
const formData = ref<Partial<UserForm>>(cloneDeep({}))

const tableRef = ref<ElTableInstance | null>(null)
const roles = ref<RoleVO[]>([])

// 使用 Set 来维护所有选中的角色ID（跨页面）
const roleIds = ref<Set<string | number>>(new Set())

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const tagsViewStore = useTagsViewStore()

const selectedRows = ref<UserForm[]>([])

/** 单击选中行数据 */
function clickRow(row: RoleVO) {
  console.log(row)
  if (checkSelectable(row)) {
    // 切换选中状态
    if (roleIds.value.has(row.roleId)) {
      roleIds.value.delete(row.roleId)
    } else {
      roleIds.value.add(row.roleId)
    }
    // 更新表格选中状态
    tableRef.value?.toggleRowSelection(row, roleIds.value.has(row.roleId))
  }
}

/** 检查角色状态 */
function checkSelectable(row: RoleVO): boolean {
  return row.status === "0"
}

/** 处理表格选择变化 */
function handleSelectionChange(selection: RoleVO[]) {
  // 先移除当前页所有角色的ID
  // tableData.value.forEach((row) => {
  //   if (checkSelectable(row)) {
  //     console.log("移除的角色ID:", row.roleId)
  //     roleIds.value.delete(row.roleId)
  //   }
  // })

  // // 再添加当前选中的角色ID
  // selection.forEach((row) => {
  //   roleIds.value.add(row.roleId)
  // })
}

async function submitForm() {
  loading.value = true
  const userId = formData.value.userId
  const rIds = Array.from(roleIds.value).join(",")
  console.log("提交的角色IDs:", rIds)

  try {
    await updateAuthRoleApi({ userId: userId as string, roleIds: rIds })
    ElMessage.success("授权成功")
    close()
  } catch (error) {
    ElMessage.error("授权失败")
  } finally {
    loading.value = false
  }
}

/** 关闭按钮 */
function close() {
  console.log("(router.currentRoute.value)", router.currentRoute)
  tagsViewStore.delVisitedView(router.currentRoute.value)
  router.push({ path: "/admin/system/user" })
}

async function getTableData(): Promise<void> {
  const userId = route.params && route.params.userId
  if (userId) {
    try {
      loading.value = true
      const { data } = await getAuthRoleApi(userId as string)
      Object.assign(formData.value, data.user)
      // 修正：直接赋值数组，而不是使用 Object.assign
      roles.value = data.roles || []

      // 初始化选中的角色ID（根据flag为true的项）
      roleIds.value.clear()
      roles.value.forEach((role) => {
        if (role.flag) {
          roleIds.value.add(role.roleId)
          console.log(role)
        }
      })

      console.log("初始化选中的角色IDs:", Array.from(roleIds.value))

      paginationData.total = roles.value.length
      await handlePagination()
    } catch {
      tableData.value = []
      formData.value = {}
    } finally {
      loading.value = false
    }
  }
}

async function handlePagination() {
  const startIndex = (paginationData.currentPage - 1) * paginationData.pageSize
  const endIndex = startIndex + paginationData.pageSize
  tableData.value = roles.value.slice(startIndex, endIndex)

  await nextTick(() => {
    // 根据 roleIds 来设置表格的选中状态
    tableData.value.forEach((row) => {
      if (roleIds.value.has(row.roleId) && checkSelectable(row)) {
        tableRef.value?.toggleRowSelection(row, true)
        console.log("选中的角色ID:", row.roleId)
      }
      if (row.roleId === 3) {
        console.log(roleIds.value)
        console.log(roleIds.value.has(row.roleId))
        console.log(checkSelectable(row))
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
  <div class="p-2">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form :inline="true" :model="formData">
        <el-form-item label="用户昵称" prop="nickName">
          <el-input v-model="formData.nickName" disabled />
        </el-form-item>
        <el-form-item label="登录账号" prop="userName">
          <el-input v-model="formData.userName" disabled />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        角色信息
      </div>
      <div style="margin: 10px 0; color: #909399;">
        已选择 {{ roleIds }} 角色
      </div>
      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData" @row-click="clickRow" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" :selectable="checkSelectable" />
          <el-table-column prop="roleId" label="角色编号" align="center" />
          <el-table-column prop="roleName" label="角色名称" align="center" />
          <el-table-column prop="roleKey" label="权限字符" align="center" />
          <el-table-column label="创建时间" align="center" prop="createTime" min-width="180">
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
      <div style="text-align: center; margin-left: -120px; margin-top: 30px">
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
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
