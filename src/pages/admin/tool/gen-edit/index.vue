<script setup name="GenEdit" lang="ts">
import type { DictTypeVO } from "@/common/apis/admin/system/dict/type/types"
import type { DbColumnVO, DbTableVO } from "@/common/apis/admin/tool/gen/types"
import { ElTable } from "element-plus"
import { getSysDictOptionSelectApi } from "@/common/apis/admin/system/dict/type"
import { getSysGenApi, updateSysGenTableApi } from "@/common/apis/admin/tool/gen"
import { useTagsViewStore } from "@/pinia/stores/tags-view"
import BasicInfoForm from "./components/BasicInfoForm.vue"
import GenInfoForm from "./components/GenInfoForm.vue"

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()

const dragTable = ref<InstanceType<typeof ElTable>>()

const loading = ref(true)

const activeName = ref("columnInfo")
const tableHeight = ref(`${document.documentElement.scrollHeight - 245}px`)
const tables = ref<DbTableVO[]>([])
const columns = ref<DbColumnVO[]>([])
const dictOptions = ref<DictTypeVO[]>([])
const info = ref<Partial<DbTableVO>>({})

const basicInfo = ref<InstanceType<typeof BasicInfoForm>>()
const genInfo = ref<InstanceType<typeof GenInfoForm>>()

/** 提交按钮 */
function submitForm() {
  const basicForm = basicInfo.value?.$refs.basicInfoForm
  const genForm = genInfo.value?.$refs.genInfoForm

  console.log(basicForm, genForm)

  Promise.all([basicForm, genForm].map(getFormPromise)).then(async (res) => {
    const validateResult = res.every(item => !!item)
    if (validateResult) {
      const genTable: any = Object.assign({}, info.value)
      genTable.columns = columns.value
      genTable.params = {
        treeCode: info.value?.treeCode,
        treeName: info.value.treeName,
        treeParentCode: info.value.treeParentCode,
        parentMenuId: info.value.parentMenuId
      }
      const response = await updateSysGenTableApi(genTable)
      ElMessage.success(response.msg)
      if (response.code === 200) {
        close()
      }
    } else {
      // proxy?.$modal.msgError('表单校验未通过，请重新检查提交内容');
    }
  })
}
function getFormPromise(form: any) {
  return new Promise((resolve) => {
    form.validate((res: any) => {
      resolve(res)
    })
  })
}
function close() {
  tagsViewStore.delVisitedView(router.currentRoute.value)
  router.back()
}

(async () => {
  const tableId = route.params && (route.params.tableId as string)
  if (tableId) {
    // 获取表详细信息
    const res = await getSysGenApi(tableId)
    columns.value = res.data.rows
    info.value = res.data.info
    tables.value = res.data.tables
    /** 查询字典下拉列表 */
    const response = await getSysDictOptionSelectApi()
    dictOptions.value = response.data
  }
  loading.value = false
})()
</script>

<template>
  <el-card v-loading="loading">
    <el-tabs v-model="activeName">
      <el-tab-pane label="基本信息" name="basic">
        <BasicInfoForm ref="basicInfo" :info="info" />
      </el-tab-pane>
      <el-tab-pane label="字段信息" name="columnInfo">
        <ElTable ref="dragTable" border :data="columns" row-key="columnId" :max-height="tableHeight">
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
                <el-option label="Date" value="Date" />
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
              <el-select v-model="scope.row.htmlType">
                <el-option label="文本框" value="input" />
                <el-option label="文本域" value="textarea" />
                <el-option label="下拉框" value="select" />
                <el-option label="单选框" value="radio" />
                <el-option label="复选框" value="checkbox" />
                <el-option label="日期控件" value="datetime" />
                <el-option label="图片上传" value="imageUpload" />
                <el-option label="文件上传" value="fileUpload" />
                <el-option label="富文本控件" value="editor" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="字典类型" min-width="12%">
            <template #default="scope">
              <el-select v-model="scope.row.dictType" clearable filterable placeholder="请选择" value-on-clear="">
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
        <GenInfoForm ref="genInfo" :info="info" :tables="tables" />
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
