import type { MenuTypeEnum } from "@/common/enums/MenuTypeEnum"

/**
 * 菜单树形结构类型
 */
export interface MenuTreeOption {
  id: string | number
  label: string
  parentId: string | number
  weight: number
  children: MenuTreeOption[]
}

export interface RoleMenuTree {
  menus: MenuTreeOption[]
  checkedKeys: string[]
}

/**
 * 菜单查询参数类型
 */
export interface MenuQuery {
  keywords: string
  menuName: string
  status: string
}

/**
 * 菜单视图对象类型
 */
export interface MenuVO extends BaseEntity {
  /**
   * 子菜单
   */
  children: MenuVO[]
  /**
   * 菜单ID
   */
  menuId: number | string
  /**
   * 菜单名称
   */
  menuName: string
  /**
   * 菜单类型（M目录 C菜单 F按钮）
   */
  menuType: MenuTypeEnum
  /**
   * 显示顺序
   */
  orderNum: number
  /**
   * 父菜单ID
   */
  parentId: number
  /**
   * 权限标识
   */
  perms: string
  /**
   * 备注
   */
  remark: string
  /**
   * 菜单状态（0正常 1停用）
   */
  status: string
  /**
   * 显示状态（0显示 1隐藏）
   */
  visible: string
}

export interface MenuForm {
  // children: MenuForm[] | undefined

  /**
   * 创建者
   */
  createBy?: number
  /**
   * 创建时间
   */
  createTime?: Date
  /**
   * 菜单ID
   */
  menuId: number | string
  /**
   * 菜单名称
   */
  menuName: string
  /**
   * 菜单类型（M目录 C菜单 F按钮）
   */
  menuType: MenuTypeEnum
  /**
   * 显示顺序
   */
  orderNum: number
  /**
   * 父菜单ID
   */
  parentId: number
  /**
   * 权限标识
   */
  perms: string
  /**
   * 备注
   */
  remark: string
  /**
   * 菜单状态（0正常 1停用）
   */
  status: string
  /**
   * 更新者
   */
  updateBy: number
  /**
   * 更新时间
   */
  updateTime: Date
  /**
   * 显示状态（0显示 1隐藏）
   */
  visible: string
}
