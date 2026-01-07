import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

/**
 * @name 常驻路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/admin"
  },
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  }
]

/**
 * @name 动态路由
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = [
  {
    path: "/admin",
    component: Layouts,
    meta: {
      title: "后台系统"
    },
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/admin/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: "首页",
          svgIcon: "dashboard",
          affix: true
        }
      },
      {
        path: "system",
        redirect: "/admin/system/dashboard",
        meta: {
          title: "系统管理",
          svgIcon: "system"
        },
        children: [
          {
            path: "user",
            meta: {
              permissions: ["system:user:list"]
            },
            children: [
              {
                path: "",
                component: () => import("@/pages/admin/system/user/index.vue"),
                name: "AdminSysUser",
                meta: {
                  title: "用户管理",
                  svgIcon: "user"
                }
              },
              {
                path: "auth-role/:userId",
                component: () => import("@/pages/admin/system/user/auth-role/index.vue"),
                name: "AdminSysUserAuthRole",
                meta: {
                  title: "分配角色",
                  hidden: true
                }
              }
            ]
          },
          {
            path: "role",
            meta: {
              permissions: ["system:role:list"]
            },
            children: [
              {
                path: "",
                component: () => import("@/pages/admin/system/role/index.vue"),
                name: "AdminSysRole",
                meta: {
                  title: "角色管理",
                  svgIcon: "peoples"
                }
              },
              {
                path: "auth-user/:roleId",
                component: () => import("@/pages/admin/system/role/auth-user/index.vue"),
                name: "AdminSysRoleAuthUser",
                meta: {
                  title: "分配用户",
                  hidden: true
                }
              }
            ]
          },
          {
            path: "dict",
            component: () => import("@/pages/admin/system/dict/index.vue"),
            name: "AdminSysDict",
            meta: {
              title: "字典管理",
              svgIcon: "dict",
              permissions: ["system:dict:list"]
            }
          },
          {
            path: "dict-data/:dictId",
            component: () => import("@/pages/admin/system/dict/data/index.vue"),
            name: "AdminSysDictData",
            meta: {
              title: "字典数据",
              hidden: true
            }
          },
          {
            path: "menu",
            component: () => import("@/pages/admin/system/menu/index.vue"),
            name: "AdminSysMenu",
            meta: {
              title: "菜单权限管理",
              svgIcon: "tree-table",
              permissions: ["system:menu:list"]
            }
          },
          {
            path: "config",
            component: () => import("@/pages/admin/system/config/index.vue"),
            name: "AdminSysConfig",
            meta: {
              title: "参数设置",
              svgIcon: "edit",
              permissions: ["system:config:list"]
            }
          },
          {
            path: "notice",
            component: () => import("@/pages/admin/system/notice/index.vue"),
            name: "AdminSysNotice",
            meta: {
              title: "通知公告",
              svgIcon: "message",
              permissions: ["system:notice:list"]
            }
          },
          {
            path: "operlog",
            component: () => import("@/pages/admin/system/operlog/index.vue"),
            name: "AdminSysOperLog",
            meta: {
              title: "操作日志",
              svgIcon: "form",
              permissions: ["monitor:operlog:list"]
            }
          },
          {
            path: "logininfor",
            component: () => import("@/pages/admin/system/logininfor/index.vue"),
            name: "AdminSysLoginInfor",
            meta: {
              title: "登录日志",
              svgIcon: "logininfor",
              permissions: ["monitor:logininfor:list"]
            }
          },
          {
            path: "client",
            component: () => import("@/pages/admin/system/client/index.vue"),
            name: "AdminSysClient",
            meta: {
              title: "客户端管理",
              svgIcon: "international",
              permissions: ["system:client:list"]
            }
          }
        ]
      },
      {
        path: "monitor",
        meta: {
          title: "系统监控",
          svgIcon: "monitor"
        },
        children: [
          {
            path: "online",
            component: () => import("@/pages/admin/monitor/online/index.vue"),
            name: "AdminSysOnline",
            meta: {
              title: "在线用户",
              svgIcon: "online",
              permissions: ["monitor:online:list"]
            }
          },
          {
            path: "cache",
            component: () => import("@/pages/admin/monitor/cache/index.vue"),
            name: "AdminSysCache",
            meta: {
              title: "缓存监控",
              svgIcon: "redis",
              permissions: ["monitor:cache:list"]
            }
          },
          {
            path: "admin",
            component: () => import("@/pages/admin/monitor/admin/index.vue"),
            name: "AdminSysAdmin",
            meta: {
              title: "Admin监控",
              svgIcon: "dashboard",
              permissions: ["monitor:admin:list"]
            }
          }
        ]
      }
    ]
  }
]

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.permissions?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
