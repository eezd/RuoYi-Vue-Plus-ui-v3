/**
 * 后台返回的路由动态生成 name，用于解决 keep-alive 缓存复用问题。
 * 参考：https://github.com/vbenjs/vue-vben-admin/issues/3927
 */
import type { Component } from "vue"
import { defineComponent, h } from "vue"

interface Options {
  name?: string
}

interface AsyncComponentModule {
  default?: Component
}

type AsyncComponentLoader = () => Promise<AsyncComponentModule | Component | unknown>

export function createCustomNameComponent(loader: AsyncComponentLoader, options: Options = {}): () => Promise<Component> {
  const { name } = options
  let component: Component | null = null

  const load = async () => {
    try {
      const loadedModule = await loader()
      component = resolveComponent(loadedModule)
    } catch (error) {
      console.error(`Cannot resolve component ${name}, error:`, error)
    }
  }

  return async () => {
    if (!component) {
      await load()
    }

    return defineComponent({
      name,
      render() {
        return component ? h(component) : null
      }
    })
  }
}

function resolveComponent(loadedModule: unknown): Component | null {
  if (isAsyncComponentModule(loadedModule)) {
    return loadedModule.default ?? null
  }

  return isComponent(loadedModule) ? loadedModule : null
}

function isAsyncComponentModule(value: unknown): value is AsyncComponentModule {
  return Boolean(value && typeof value === "object" && "default" in value)
}

function isComponent(value: unknown): value is Component {
  return Boolean(value && (typeof value === "object" || typeof value === "function"))
}
