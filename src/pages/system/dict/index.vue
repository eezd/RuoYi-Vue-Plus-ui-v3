<script lang="ts" setup>
import type { DictDataForm, DictDataQuery, DictDataVO } from "@@/apis/system/dict/data/types.ts"
import type { DictTypeForm, DictTypeQuery, DictTypeVO } from "@@/apis/system/dict/type/types.ts"
import { delSysDictDataApi, getSysDictDataCodeApi, getSysDictDataListApi } from "@@/apis/system/dict/data"
import {
  addSysDictTypeApi,
  delSysDictTypeApi,
  getSysDictListTypeApi,
  getSysDictTypeApi,
  refreshSysDictCacheApi,
  updateSysDictTypeApi
} from "@@/apis/system/dict/type"
import DictTag from "@@/components/DictTag/index.vue"
import { useDict } from "@@/composables/useDict.ts"
import { usePagination } from "@@/composables/usePagination.ts"
import { formatDateTime } from "@@/utils"
import { Delete, Edit, Plus, QuestionFilled, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { download } from "@/http/download"
import { useDictStore } from "@/pinia/stores/dict"
import DictDataDialog from "./data/components/DictDialog.vue"

defineOptions({
  name: "AdminSysDict"
})

const { sys_yes_no } = toRefs<any>(useDict("sys_yes_no"))

const typeLoading = ref(false)
const dataLoading = ref(false)
const typeList = ref<DictTypeVO[]>([])
const dataList = ref<DictDataVO[]>([])
const currentDict = ref<DictTypeVO | null>(null)

const showTypeSearch = ref(true)
const showDataSearch = ref(true)

const typeIds = ref<Array<string | number>>([])
const dataIds = ref<Array<string | number>>([])
const typeSingle = ref(true)
const typeMultiple = ref(true)
const dataSingle = ref(true)
const dataMultiple = ref(true)

const typeQueryFormRef = useTemplateRef("typeQueryFormRef")
const dataQueryFormRef = useTemplateRef("dataQueryFormRef")
const typeFormRef = useTemplateRef("typeFormRef")
const typeTableRef = useTemplateRef("typeTableRef")

const typeDialog = reactive<DialogOption>({
  visible: false,
  title: "",
  loading: false,
  isEditable: false
})

const dataDialog = reactive<DialogOption>({
  visible: false,
  title: "",
  loading: false,
  isEditable: false
})

const typeInitFormData: DictTypeForm = {
  dictId: undefined,
  dictName: "",
  dictType: "",
  remark: ""
}

const dataInitFormData: DictDataForm = {
  dictCode: undefined,
  dictType: "",
  dictLabel: "",
  dictValue: "",
  cssClass: "",
  listClass: "primary",
  isDefault: "N",
  dictSort: 0,
  remark: ""
}

const typeState = reactive<PageData<DictTypeForm, DictTypeQuery>>({
  form: { ...typeInitFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    dictName: "",
    dictType: ""
  },
  rules: {
    dictName: [{ required: true, message: "字典名称必填", trigger: "blur" }],
    dictType: [{ required: true, message: "字典类型必填", trigger: "blur" }]
  }
})

const dataState = reactive<PageData<DictDataForm, DictDataQuery>>({
  form: { ...dataInitFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    dictType: "",
    dictLabel: ""
  },
  rules: {}
})

const { queryParams: typeQueryParams, form: typeForm } = toRefs(typeState)
const { queryParams: dataQueryParams, form: dataForm } = toRefs(dataState)

const { paginationData: typePagination } = usePagination()
const { paginationData: dataPagination } = usePagination()

const hasCurrentDict = computed(() => Boolean(currentDict.value))
const currentDictLabel = computed(() => {
  if (!currentDict.value) return "请先选择字典"
  return `${currentDict.value.dictName} / ${currentDict.value.dictType}`
})

function resetTypeForm() {
  typeForm.value = { ...typeInitFormData }
  typeFormRef.value?.clearValidate()
}

function resetDataForm() {
  dataForm.value = { ...dataInitFormData }
}

function handleTypeSelectionChange(selection: DictTypeVO[]) {
  typeIds.value = selection.map(item => item.dictId)
  typeSingle.value = selection.length !== 1
  typeMultiple.value = selection.length === 0
}

function handleDataSelectionChange(selection: DictDataVO[]) {
  dataIds.value = selection.map(item => item.dictCode)
  dataSingle.value = selection.length !== 1
  dataMultiple.value = selection.length === 0
}

function setCurrentDict(row: DictTypeVO) {
  currentDict.value = row
  dataQueryParams.value.dictType = row.dictType
  dataQueryParams.value.dictLabel = ""
  dataPagination.currentPage = 1
  getDataList()
  nextTick(() => typeTableRef.value?.setCurrentRow(row))
}

async function getTypeList() {
  try {
    typeLoading.value = true
    const { rows, total } = await getSysDictListTypeApi({
      ...typeQueryParams.value,
      pageNum: typePagination.currentPage,
      pageSize: typePagination.pageSize
    })
    typeList.value = rows
    typePagination.total = total
    if (!currentDict.value && rows.length > 0) {
      setCurrentDict(rows[0])
    } else if (currentDict.value) {
      const matched = rows.find(item => item.dictId === currentDict.value?.dictId)
      if (matched) {
        currentDict.value = matched
      }
    }
  } catch {
    typeList.value = []
    typePagination.total = 0
    currentDict.value = null
    dataList.value = []
    dataPagination.total = 0
  } finally {
    typeLoading.value = false
  }
}

async function getDataList() {
  if (!currentDict.value) {
    dataList.value = []
    dataPagination.total = 0
    return
  }
  try {
    dataLoading.value = true
    const { rows, total } = await getSysDictDataListApi({
      ...dataQueryParams.value,
      dictType: currentDict.value.dictType,
      pageNum: dataPagination.currentPage,
      pageSize: dataPagination.pageSize
    })
    dataList.value = rows
    dataPagination.total = total
  } catch {
    dataList.value = []
    dataPagination.total = 0
  } finally {
    dataLoading.value = false
  }
}

function handleTypeQuery() {
  typePagination.currentPage = 1
  getTypeList()
}

function handleTypeResetQuery() {
  typeQueryFormRef.value?.resetFields()
  typePagination.currentPage = 1
  getTypeList()
}

function handleDataQuery() {
  if (!currentDict.value) return
  dataPagination.currentPage = 1
  getDataList()
}

function handleDataResetQuery() {
  dataQueryFormRef.value?.resetFields()
  dataQueryParams.value.dictType = currentDict.value?.dictType || ""
  dataPagination.currentPage = 1
  getDataList()
}

function handleTypeAdd() {
  resetTypeForm()
  typeDialog.visible = true
  typeDialog.title = "新增字典类型"
  typeDialog.isEditable = true
}

async function handleTypeUpdate(row?: DictTypeVO) {
  const target = row?.dictId ?? typeIds.value[0]
  if (!target) {
    ElMessage.warning("请选择要修改的字典类型")
    return
  }
  resetTypeForm()
  const { data } = await getSysDictTypeApi(target)
  Object.assign(typeForm.value, data)
  typeDialog.visible = true
  typeDialog.title = "修改字典类型"
  typeDialog.isEditable = true
}

async function submitTypeForm() {
  if (!typeFormRef.value) return
  await typeFormRef.value.validate(async (valid) => {
    if (!valid) return
    typeDialog.loading = true
    try {
      const isUpdate = !!typeForm.value.dictId
      const res = isUpdate
        ? await updateSysDictTypeApi(typeForm.value as DictTypeForm)
        : await addSysDictTypeApi(typeForm.value as DictTypeForm)
      ElMessage.success(res.msg)
      typeDialog.visible = false
      await getTypeList()
    } finally {
      typeDialog.loading = false
    }
  })
}

async function handleTypeDelete(row?: DictTypeVO) {
  const items = row ? [row.dictId] : typeIds.value
  if (!items.length) {
    ElMessage.warning("请选择要删除的字典类型")
    return
  }
  await ElMessageBox.confirm(`确认删除选中的 ${items.length} 条字典类型吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  await delSysDictTypeApi(items)
  ElMessage.success("删除成功")
  if (currentDict.value && items.includes(currentDict.value?.dictId)) {
    currentDict.value = null
    dataList.value = []
    dataPagination.total = 0
  }
  await getTypeList()
}

async function handleRefreshCache() {
  await refreshSysDictCacheApi()
  ElMessage.success("刷新成功")
  useDictStore().cleanDict()
}

function handleTypeExport() {
  const timestamp = new Date().getTime()
  download("/system/dict/type/export", { ...typeQueryParams.value }, `dict_${timestamp}.xlsx`)
}

function handleDataAdd() {
  if (!currentDict.value) {
    ElMessage.warning("请先选择字典")
    return
  }
  resetDataForm()
  dataForm.value.dictType = currentDict.value.dictType
  dataDialog.visible = true
  dataDialog.title = "新增字典数据"
  dataDialog.isEditable = true
}

async function handleDataUpdate(row?: DictDataVO) {
  if (!currentDict.value) {
    ElMessage.warning("请先选择字典")
    return
  }
  const target = row?.dictCode ?? dataIds.value[0]
  if (!target) {
    ElMessage.warning("请选择要修改的字典数据")
    return
  }
  resetDataForm()
  const { data } = await getSysDictDataCodeApi(target)
  Object.assign(dataForm.value, data)
  dataDialog.visible = true
  dataDialog.title = "修改字典数据"
  dataDialog.isEditable = true
}

async function handleDataDelete(row?: DictDataVO) {
  if (!currentDict.value) {
    ElMessage.warning("请先选择字典")
    return
  }
  const items = row ? [row.dictCode] : dataIds.value
  if (!items.length) {
    ElMessage.warning("请选择要删除的字典数据")
    return
  }
  await ElMessageBox.confirm(`确认删除选中的 ${items.length} 条字典数据吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  await delSysDictDataApi(items)
  ElMessage.success("删除成功")
  await getDataList()
  useDictStore().removeDict(currentDict.value.dictType)
}

async function handleDataSuccess() {
  if (currentDict.value) {
    useDictStore().removeDict(currentDict.value.dictType)
  }
  await getDataList()
}

function handleDataExport() {
  if (!currentDict.value) {
    ElMessage.warning("请先选择字典")
    return
  }
  const timestamp = new Date().getTime()
  download("/system/dict/data/export", { ...dataQueryParams.value }, `dict_data_${timestamp}.xlsx`)
}

watch(() => typePagination.currentPage, () => getTypeList())
watch(() => typePagination.pageSize, () => getTypeList())
watch(() => dataPagination.currentPage, () => getDataList())
watch(() => dataPagination.pageSize, () => getDataList())

onMounted(async () => {
  await getTypeList()
})
</script>

<template>
  <div class="p-2 app-container dict-page">
    <el-row :gutter="16" class="dict-grid">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="dict-card table-panel">
          <template #header>
            <div class="toolbar-shell dict-card__header">
              <div class="table-heading">
                <div class="panel-heading search-panel-toggle dict-title-toggle" @click.stop="showTypeSearch = !showTypeSearch">
                  <div>
                    <h3>字典管理</h3>
                  </div>
                </div>
              </div>
              <!-- <div class="toolbar-actions">
                <el-tooltip content="刷新当前页" placement="top">
                  <el-button type="primary" :icon="RefreshRight" circle @click="getTypeList" />
                </el-tooltip>
                <el-tooltip :content="showTypeSearch ? '隐藏搜索' : '显示搜索'" placement="top">
                  <el-button :type="showTypeSearch ? 'primary' : 'default'" :icon="Search" circle @click="showTypeSearch = !showTypeSearch" />
                </el-tooltip>
              </div> -->
            </div>
          </template>

          <div class="dict-search" :class="{ 'is-collapsed': !showTypeSearch }">
            <el-form ref="typeQueryFormRef" :model="typeQueryParams" :inline="true" class="query-form">
              <el-form-item label="字典名称" prop="dictName">
                <el-input v-model="typeQueryParams.dictName" placeholder="请输入字典名称" clearable @keyup.enter="handleTypeQuery" />
              </el-form-item>
              <el-form-item label="字典类型" prop="dictType">
                <el-input v-model="typeQueryParams.dictType" placeholder="请输入字典类型" clearable @keyup.enter="handleTypeQuery" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleTypeQuery">
                  搜索
                </el-button>
                <el-button :icon="Refresh" @click="handleTypeResetQuery">
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="toolbar-actions dict-actions">
            <el-button v-hasPermi="['system:dict:add']" type="primary" plain :icon="Plus" @click="handleTypeAdd">
              新增
            </el-button>
            <el-button v-hasPermi="['system:dict:edit']" type="success" plain :icon="Edit" :disabled="typeSingle" @click="handleTypeUpdate()">
              修改
            </el-button>
            <el-button v-hasPermi="['system:dict:remove']" type="danger" plain :icon="Delete" :disabled="typeMultiple" @click="handleTypeDelete()">
              删除
            </el-button>
            <el-button v-hasPermi="['system:dict:export']" type="warning" plain :icon="RefreshRight" @click="handleTypeExport">
              导出
            </el-button>
            <el-button v-hasPermi="['system:dict:remove']" type="danger" plain :icon="Refresh" @click="handleRefreshCache">
              刷新缓存
            </el-button>
          </div>

          <div class="dict-table-wrap">
            <el-table
              ref="typeTableRef"
              v-loading="typeLoading"
              border
              class="data-table"
              :data="typeList"
              highlight-current-row
              @row-click="setCurrentDict"
              @selection-change="handleTypeSelectionChange"
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="字典名称" align="center" prop="dictName" width="120" />
              <el-table-column label="字典类型" align="center" prop="dictType" width="160">
                <template #default="scope">
                  <span class="link-type" @click.stop="setCurrentDict(scope.row)">{{ scope.row.dictType }}</span>
                </template>
              </el-table-column>
              <el-table-column label="备注" align="center" prop="remark" width="160" />
              <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                <template #default="scope">
                  <span>{{ formatDateTime(scope.row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" fixed="right" align="center" width="120" class-name="small-padding fixed-width">
                <template #default="scope">
                  <el-tooltip content="修改" placement="top">
                    <el-button v-hasPermi="['system:dict:edit']" link type="primary" :icon="Edit" @click="handleTypeUpdate(scope.row)" />
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <el-button v-hasPermi="['system:dict:remove']" link type="primary" :icon="Delete" @click="handleTypeDelete(scope.row)" />
                  </el-tooltip>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-if="typePagination.total > 0" class="pager-wrapper">
            <el-pagination
              background
              :layout="typePagination.layout"
              :page-sizes="typePagination.pageSizes"
              :total="typePagination.total"
              v-model:page-size="typePagination.pageSize"
              v-model:current-page="typePagination.currentPage"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="dict-card table-panel">
          <template #header>
            <div class="toolbar-shell dict-card__header">
              <div class="table-heading">
                <div class="panel-heading search-panel-toggle dict-title-toggle" @click.stop="showDataSearch = !showDataSearch">
                  <div>
                    <h3>字典数据</h3>
                    <p v-if="hasCurrentDict" class="dict-card__subtitle">
                      {{ currentDictLabel }}
                    </p>
                  </div>
                </div>
              </div>
              <!-- <div class="toolbar-actions">
                <el-tooltip content="刷新当前页" placement="top">
                  <el-button type="primary" :icon="RefreshRight" circle @click="handleDataSuccess" />
                </el-tooltip>
                <el-tooltip :content="showDataSearch ? '隐藏搜索' : '显示搜索'" placement="top">
                  <el-button :type="showDataSearch ? 'primary' : 'default'" :icon="Search" circle @click="showDataSearch = !showDataSearch" />
                </el-tooltip>
              </div> -->
            </div>
          </template>

          <div class="dict-search" :class="{ 'is-collapsed': !showDataSearch }">
            <el-form ref="dataQueryFormRef" :model="dataQueryParams" :inline="true" class="query-form">
              <el-form-item label="字典标签" prop="dictLabel">
                <el-input v-model="dataQueryParams.dictLabel" placeholder="请输入字典标签" clearable :disabled="!hasCurrentDict" @keyup.enter="handleDataQuery" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" :disabled="!hasCurrentDict" @click="handleDataQuery">
                  搜索
                </el-button>
                <el-button :icon="Refresh" :disabled="!hasCurrentDict" @click="handleDataResetQuery">
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="toolbar-actions dict-actions">
            <el-button v-hasPermi="['system:dict:add']" type="primary" plain :icon="Plus" :disabled="!hasCurrentDict" @click="handleDataAdd">
              新增
            </el-button>
            <el-button v-hasPermi="['system:dict:edit']" type="success" plain :icon="Edit" :disabled="dataSingle || !hasCurrentDict" @click="handleDataUpdate()">
              修改
            </el-button>
            <el-button v-hasPermi="['system:dict:remove']" type="danger" plain :icon="Delete" :disabled="dataMultiple || !hasCurrentDict" @click="handleDataDelete()">
              删除
            </el-button>
            <el-button v-hasPermi="['system:dict:export']" type="warning" plain :icon="RefreshRight" :disabled="!hasCurrentDict" @click="handleDataExport">
              导出
            </el-button>
          </div>

          <div class="dict-table-wrap">
            <el-table v-loading="dataLoading" border class="data-table" :data="dataList" @selection-change="handleDataSelectionChange">
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column v-if="false" label="字典编码" align="center" prop="dictCode" />
              <el-table-column label="字典标签" align="center" prop="dictLabel" width="100">
                <template #default="scope">
                  <span
                    v-if="(scope.row.listClass === '' || scope.row.listClass === 'default') && (scope.row.cssClass === '' || scope.row.cssClass == null)"
                  >{{ scope.row.dictLabel }}</span>
                  <el-tag
                    v-else
                    :type="scope.row.listClass === 'primary' || scope.row.listClass === 'default' ? 'primary' : scope.row.listClass"
                    :class="scope.row.cssClass"
                  >
                    {{ scope.row.dictLabel }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="字典键值" align="center" prop="dictValue" width="100" />
              <el-table-column label="字典排序" align="center" prop="dictSort" width="80" />
              <el-table-column label="是否默认" align="center" prop="isDefault" width="100">
                <template #default="scope">
                  <DictTag :options="sys_yes_no" :value="scope.row.isDefault" />
                </template>
              </el-table-column>
              <el-table-column label="备注" align="center" prop="remark" width="100" />
              <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                <template #default="scope">
                  <span>{{ formatDateTime(scope.row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column fixed="right" label="操作" align="center" width="120" class-name="small-padding fixed-width">
                <template #default="scope">
                  <el-tooltip content="修改" placement="top">
                    <el-button v-hasPermi="['system:dict:edit']" link type="primary" :icon="Edit" @click="handleDataUpdate(scope.row)" />
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <el-button v-hasPermi="['system:dict:remove']" link type="primary" :icon="Delete" @click="handleDataDelete(scope.row)" />
                  </el-tooltip>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-if="dataPagination.total > 0" class="pager-wrapper">
            <el-pagination
              background
              :layout="dataPagination.layout"
              :page-sizes="dataPagination.pageSizes"
              :total="dataPagination.total"
              v-model:page-size="dataPagination.pageSize"
              v-model:current-page="dataPagination.currentPage"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="typeDialog.visible" :title="typeDialog.title" width="500px" append-to-body>
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeState.rules" label-width="100px">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="typeForm.dictName" placeholder="请输入字典名称" :disabled="!typeDialog.isEditable" />
        </el-form-item>
        <el-form-item prop="dictType">
          <template #label>
            <span>
              <el-tooltip content="数据存储中的Key值，如：sys_user_gender" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
              字典类型
            </span>
          </template>
          <el-input v-model="typeForm.dictType" placeholder="请输入字典类型" maxlength="100" :disabled="!typeDialog.isEditable" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="typeForm.remark" type="textarea" placeholder="请输入内容" :disabled="!typeDialog.isEditable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitTypeForm" :loading="typeDialog.loading" :disabled="!typeDialog.isEditable">
            确 定
          </el-button>
          <el-button @click="typeDialog.visible = false">
            取 消
          </el-button>
        </div>
      </template>
    </el-dialog>

    <DictDataDialog
      v-model:dialog="dataDialog"
      v-model:form-data="dataForm"
      @success="handleDataSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
.dict-grid {
  row-gap: 16px;
}

.dict-card {
  height: 100%;
}

.dict-card__header {
  gap: 12px;
}

.dict-title-toggle {
  padding: 0 !important;
}

.dict-card__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dict-search {
  overflow: hidden;
  max-height: 240px;
  opacity: 1;
  margin-bottom: 12px;
  transition:
    max-height 0.2s ease,
    opacity 0.2s ease,
    margin-bottom 0.2s ease;
}

.dict-search.is-collapsed {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
}

.dict-actions {
  margin-bottom: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.dict-table-wrap {
  margin-bottom: 16px;
}
</style>
