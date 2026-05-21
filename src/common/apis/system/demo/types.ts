export interface DemoVO extends BaseEntity {
  /**
   * 主键
   */
  id: string | number

  /**
   * 部门id
   */
  deptId: string | number

  /**
   * 用户id
   */
  userId: string | number

  /**
   * 排序号
   */
  orderNum: number

  /**
   * key键
   */
  testKey: string

  /**
   * 值
   */
  value: string

  /**
   * 版本
   */
  version?: string | number

}

export interface DemoForm {
  /**
   * 主键
   */
  id: string | number

  /**
   * 部门id
   */
  deptId: string | number

  /**
   * 用户id
   */
  userId: string | number

  /**
   * 排序号
   */
  orderNum: number

  /**
   * key键
   */
  testKey: string

  /**
   * 值
   */
  value: string

}

export interface DemoQuery extends PageQuery {

  /**
   * 部门id
   */
  deptId?: string | number

  /**
   * 用户id
   */
  userId?: string | number

  /**
   * 排序号
   */
  orderNum?: number

  /**
   * key键
   */
  testKey?: string

  /**
   * 值
   */
  value?: string

}
