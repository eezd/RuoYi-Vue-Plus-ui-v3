<script setup name="GenEdit" lang="ts">
import type { DictTypeVO } from "@@/apis/system/dict/type/types"
import type { DbColumnVO, DbTableForm, DbTableVO, GenHtmlType } from "@@/apis/tool/gen/types"
import { getSysDictOptionSelectApi } from "@@/apis/system/dict/type"
import { getSysGenApi, updateSysGenTableApi } from "@@/apis/tool/gen"
import { ElTable } from "element-plus"
import { useTagsViewStore } from "@/pinia/stores/tags-view"
import BasicInfoForm from "./components/BasicInfoForm.vue"
import GenInfoForm from "./components/GenInfoForm.vue"

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()

const loading = ref(true)
const activeName = ref("columnInfo")
const tableHeight = ref(`${document.documentElement.scrollHeight - 245}px`)
const columns = ref<DbColumnVO[]>([])
const dictOptions = ref<DictTypeVO[]>([])
const info = ref<Partial<DbTableVO>>({})

const basicInfo = ref<InstanceType<typeof BasicInfoForm>>()
const genInfo = ref<InstanceType<typeof GenInfoForm>>()

const DICT_HTML_TYPES: GenHtmlType[] = ["select", "radio", "checkbox", "switch"]

function supportsDictHtmlType(htmlType?: string) {
  return DICT_HTML_TYPES.includes((htmlType || "") as GenHtmlType)
}

function normalizeColumnDictType(column: Partial<DbColumnVO>) {
  if (!supportsDictHtmlType(column.htmlType)) {
    column.dictType = ""
  }
}

function handleHtmlTypeChange(column: DbColumnVO) {
  normalizeColumnDictType(column)
}

async function submitForm() {
  loading.value = true
  try {
    const [basicOk, genOk] = await Promise.all([
      basicInfo.value?.validate() ?? Promise.resolve(true),
      genInfo.value?.validate() ?? Promise.resolve(true)
    ])
    if (!basicOk || !genOk) {
      ElMessage.error("表单校验未通过，请重新检查提交内容")
      return
    }
    columns.value.forEach(normalizeColumnDictType)
    const response = await updateSysGenTableApi(buildGenTablePayload())
    ElMessage.success(response.msg)
    if (response.code === 200) close()
  } catch (err) {
    ElMessage.error("提交失败，请稍后重试")
    console.error(err)
  } finally {
    loading.value = false
  }
}

function buildGenTablePayload(): DbTableForm {
  return {
    ...(info.value as DbTableForm),
    columns: columns.value,
    params: {
      treeCode: info.value.treeCode,
      treeName: info.value.treeName,
      treeParentCode: info.value.treeParentCode,
      parentMenuId: info.value.parentMenuId,
      enableExport: info.value.enableExport,
      enableStatus: info.value.enableStatus,
      statusField: info.value.statusField,
      enableUnique: info.value.enableUnique,
      uniqueFields: info.value.uniqueFields,
      enableSort: info.value.enableSort,
      sortField: info.value.sortField,
      treeRootValue: info.value.treeRootValue,
      treeAncestors: info.value.treeAncestorsField,
      treeOrderField: info.value.treeOrderField
    }
  }
}

function close() {
  tagsViewStore.delVisitedView(router.currentRoute.value)
  router.back()
}

onMounted(async () => {
  const tableId = (route.params?.table_id || route.params?.tableId) as string | undefined
  if (!tableId) {
    loading.value = false
    return
  }
  const res = await getSysGenApi(tableId)
  const detail = res.data
  columns.value = (detail?.rows || []).map((column) => {
    const item = { ...column }
    normalizeColumnDictType(item)
    return item
  })
  info.value = {
    enableExport: true,
    enableStatus: false,
    statusField: "",
    enableUnique: false,
    uniqueFields: [],
    enableSort: false,
    sortField: "",
    treeRootValue: "0",
    treeAncestorsField: "",
    treeOrderField: "",
    ...(detail?.info || {})
  }
  const response = await getSysDictOptionSelectApi()
  dictOptions.value = response.data || []
  loading.value = false
})
</script>

<template>
  <el-card v-loading="loading" class="min-w-[1280px]">
    <el-tabs v-model="activeName">
      <el-tab-pane label="基本信息" name="basic">
        <BasicInfoForm ref="basicInfo" v-model:info="info" />
      </el-tab-pane>
      <el-tab-pane label="字段信息" name="columnInfo">
        <ElTable border :data="columns" row-key="columnId" :max-height="tableHeight">
          <el-table-column label="序号" type="index" min-width="5%" />
          <el-table-column label="字段列名" prop="columnName" min-width="10%" :show-overflow-tooltip="true" />
          <el-table-column label="字段描述" min-width="10%">
            <template #default="scope">
              <el-input v-model="scope.row.columnComment" />
            </template>
          </el-table-column>
          <el-table-column label="物理类型" prop="columnType" min-width="10%" :show-overflow-tooltip="true" />
          <el-table-column label="Java类型" min-width="11%">
            <template #default="scope">
              <el-select v-model="scope.row.javaType">
                <el-option label="Long" value="Long" />
                <el-option label="String" value="String" />
                <el-option label="Integer" value="Integer" />
                <el-option label="Double" value="Double" />
                <el-option label="BigDecimal" value="BigDecimal" />
                <el-option label="LocalDateTime" value="LocalDateTime" />
                <el-option label="Boolean" value="Boolean" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="java属性" min-width="10%">
            <template #default="scope">
              <el-input v-model="scope.row.javaField" />
            </template>
          </el-table-column>
          <el-table-column label="插入" min-width="5%">
            <template #default="scope">
              <el-checkbox v-model="scope.row.isInsert" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="编辑" min-width="5%">
            <template #default="scope">
              <el-checkbox v-model="scope.row.isEdit" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="列表" min-width="5%">
            <template #default="scope">
              <el-checkbox v-model="scope.row.isList" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="查询" min-width="5%">
            <template #default="scope">
              <el-checkbox v-model="scope.row.isQuery" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="查询方式" min-width="10%">
            <template #default="scope">
              <el-select v-model="scope.row.queryType">
                <el-option label="=" value="EQ" />
                <el-option label="!=" value="NE" />
                <el-option label=">" value="GT" />
                <el-option label=">=" value="GE" />
                <el-option label="<" value="LT" />
                <el-option label="<=" value="LE" />
                <el-option label="LIKE" value="LIKE" />
                <el-option label="BETWEEN" value="BETWEEN" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="必填" min-width="5%">
            <template #default="scope">
              <el-checkbox v-model="scope.row.isRequired" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="显示类型" min-width="12%">
            <template #default="scope">
              <el-select v-model="scope.row.htmlType" @change="handleHtmlTypeChange(scope.row)">
                <el-option label="文本框" value="input" />
                <el-option label="数字输入" value="inputNumber" />
                <el-option label="文本域" value="textarea" />
                <el-option label="下拉框" value="select" />
                <el-option label="单选框" value="radio" />
                <el-option label="复选框" value="checkbox" />
                <el-option label="开关" value="switch" />
                <el-option label="日期控件" value="datetime" />
                <el-option label="图片上传" value="imageUpload" />
                <el-option label="文件上传" value="fileUpload" />
                <el-option label="富文本控件" value="editor" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="字典类型" min-width="12%">
            <template #default="scope">
              <el-select
                v-model="scope.row.dictType"
                clearable
                filterable
                placeholder="请选择"
                value-on-clear=""
                :disabled="!supportsDictHtmlType(scope.row.htmlType)"
              >
                <el-option v-for="dict in dictOptions" :key="dict.dictType" :label="dict.dictName" :value="dict.dictType">
                  <span style="float: left">{{ dict.dictName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ dict.dictType }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
        </ElTable>
      </el-tab-pane>
      <el-tab-pane label="生成信息" name="genInfo">
        <GenInfoForm ref="genInfo" v-model:info="info" :columns="columns" />
      </el-tab-pane>
    </el-tabs>
    <el-form label-width="100px">
      <div style="text-align: center; margin-left: -100px; margin-top: 10px">
        <el-button type="primary" @click="submitForm()">
          提交
        </el-button>
        <el-button @click="close()">
          返回
        </el-button>
      </div>
    </el-form>
  </el-card>
</template>
