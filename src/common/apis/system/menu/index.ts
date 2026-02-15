import type { MenuForm, MenuQuery, MenuTreeOption, MenuVO, RoleMenuTree } from "./types.ts"
import { request } from "@/http/axios.ts"

export function getSysMenuListApi(query?: MenuQuery) {
  return request <ApiResponseData<MenuVO[]>>({
    url: "/system/menu/list",
    method: "get",
    params: query
  })
}

// 查询菜单详细
export function getSysMenuApi(menuId: string | number) {
  return request<ApiResponseData<MenuVO>>({
    url: `/system/menu/${menuId}`,
    method: "get"
  })
}

// 查询菜单下拉树结构
export function getMenuTreeSelectApi() {
  return request<ApiResponseData<MenuTreeOption[]>>({
    url: "/system/menu/treeselect",
    method: "get"
  })
}

// 根据角色ID查询菜单下拉树结构
export function getMenuTreeSelectByRoleIdApi(roleId: string | number) {
  return request<ApiResponseData<RoleMenuTree>>({
    url: `/system/menu/roleMenuTreeselect/${roleId}`,
    method: "get"
  })
}

// 根据角色ID查询菜单下拉树结构
export function getMenuTreeSelectByPackageIdApi(packageId: string | number) {
  return request<ApiResponseData<RoleMenuTree>>({
    url: `/system/menu/tenantPackageMenuTreeselect/${packageId}`,
    method: "get"
  })
}

// 新增菜单
export function addSysMenuApi(data: MenuForm) {
  return request<ApiResponseData<null>>({
    url: "/system/menu",
    method: "post",
    data
  })
}

// 修改菜单
export function updateSysMenuApi(data: MenuForm) {
  return request<ApiResponseData<null>>({
    url: "/system/menu",
    method: "put",
    data
  })
}

// 删除菜单
export function delSysMenuApi(menuId: string | number) {
  return request<ApiResponseData<null>>({
    url: `/system/menu/${menuId}`,
    method: "delete"
  })
}

// 级联删除菜单
export function delSysMenuCascadeApi(menuIds: Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/system/menu/cascade/${menuIds}`,
    method: "delete"
  })
}
