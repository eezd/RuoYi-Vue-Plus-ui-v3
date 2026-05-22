export interface TableVO extends BaseEntity {
  tableId: string | number
  dataName: string
  tableName: string
  tableComment: string
  className: string
  tplCategory: GenTplCategory
  packageName: string
  moduleName: string
  businessName: string
  functionName: string
  functionAuthor: string
  pkColumn?: DbColumnVO
  columns?: DbColumnVO[]
  options?: string
  remark?: string
  treeCode?: string
  treeParentCode?: string
  treeName?: string
  menuIds?: Array<string | number>
  parentMenuId?: string | number
  parentMenuName?: string
  enableExport?: boolean
  enableStatus?: boolean
  statusField?: string
  enableUnique?: boolean
  uniqueFields?: string[]
  enableSort?: boolean
  sortField?: string
  treeRootValue?: string
  treeAncestorsField?: string
  treeOrderField?: string
  tree: boolean
  crud: boolean
}

export interface TableQuery extends PageQuery {
  tableName?: string
  tableComment?: string
  dataName?: string
  params?: {
    beginTime?: string
    endTime?: string
  }
}

export type GenTplCategory = "crud" | "tree"
export type GenJavaType = "Long" | "String" | "Integer" | "Double" | "BigDecimal" | "LocalDateTime" | "Boolean"
export type GenHtmlType = "input" | "inputNumber" | "textarea" | "select" | "radio" | "checkbox" | "switch" | "datetime" | "imageUpload" | "fileUpload" | "editor"
export type GenQueryType = "EQ" | "NE" | "GT" | "GE" | "LT" | "LE" | "LIKE" | "BETWEEN"
export type GenFlag = "0" | "1"

export interface DbColumnVO extends BaseEntity {
  columnId: string | number
  tableId: string | number
  columnName: string
  columnComment: string
  columnType: string
  javaType: GenJavaType
  javaField: string
  isPk: GenFlag
  isIncrement: GenFlag
  isRequired: GenFlag
  isInsert: GenFlag
  isEdit: GenFlag
  isList: GenFlag
  isQuery: GenFlag
  queryType: GenQueryType
  htmlType: GenHtmlType
  dictType: string
  sort: number
  increment: boolean
  capJavaField: string
  usableColumn: boolean
  superColumn: boolean
  list: boolean
  pk: boolean
  insert: boolean
  edit: boolean
  query: boolean
  required: boolean
}

export interface DbTableVO extends BaseEntity {
  tableId: string | number
  dataName?: string
  tableName: string
  tableComment: string
  className?: string
  tplCategory?: GenTplCategory
  packageName?: string
  moduleName?: string
  businessName?: string
  functionName?: string
  functionAuthor?: string
  pkColumn?: DbColumnVO
  columns?: DbColumnVO[]
  options?: string
  remark?: string
  treeCode?: string
  treeParentCode?: string
  treeName?: string
  menuIds?: Array<string | number>
  parentMenuId?: string | number
  parentMenuName?: string
  enableExport?: boolean
  enableStatus?: boolean
  statusField?: string
  enableUnique?: boolean
  uniqueFields?: string[]
  enableSort?: boolean
  sortField?: string
  treeRootValue?: string
  treeAncestorsField?: string
  treeOrderField?: string
  tree?: boolean
  crud?: boolean
}

export interface DbTableQuery extends PageQuery {
  dataName: string
  tableName: string
  tableComment: string
}

export interface GenTableDetailPayload {
  info: DbTableVO
  rows: DbColumnVO[]
}

export interface DbParamForm {
  treeCode?: string
  treeName?: string
  treeParentCode?: string
  parentMenuId?: string | number
  enableExport?: boolean
  enableStatus?: boolean
  statusField?: string
  enableUnique?: boolean
  uniqueFields?: string[]
  enableSort?: boolean
  sortField?: string
  treeRootValue?: string
  treeAncestors?: string
  treeOrderField?: string
}

export interface DbColumnForm extends BaseEntity {
  columnId: string | number
  tableId: string | number
  columnName: string
  columnComment: string
  columnType: string
  javaType: GenJavaType
  javaField: string
  isPk: GenFlag
  isIncrement: GenFlag
  isRequired: GenFlag
  isInsert: GenFlag
  isEdit: GenFlag
  isList: GenFlag
  isQuery: GenFlag
  queryType: GenQueryType
  htmlType: GenHtmlType
  dictType: string
  sort: number
  increment: boolean
  capJavaField: string
  usableColumn: boolean
  superColumn: boolean
  list: boolean
  pk: boolean
  insert: boolean
  edit: boolean
  query: boolean
  required: boolean
}

export interface DbTableForm extends BaseEntity {
  tableId: string | number
  dataName?: string
  tableName: string
  tableComment: string
  className: string
  tplCategory: GenTplCategory
  packageName: string
  moduleName: string
  businessName: string
  functionName: string
  functionAuthor: string
  pkColumn?: DbColumnVO
  columns: DbColumnForm[]
  options?: string
  remark?: string
  treeCode?: string
  treeParentCode?: string
  treeName?: string
  menuIds?: Array<string | number>
  parentMenuId?: string | number
  parentMenuName?: string
  enableExport?: boolean
  enableStatus?: boolean
  statusField?: string
  enableUnique?: boolean
  uniqueFields?: string[]
  enableSort?: boolean
  sortField?: string
  treeRootValue?: string
  treeAncestorsField?: string
  treeOrderField?: string
  tree?: boolean
  crud?: boolean
  params: DbParamForm
}
