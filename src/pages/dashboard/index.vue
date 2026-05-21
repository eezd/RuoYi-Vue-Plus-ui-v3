<script lang="ts" setup>
import { Connection, Document, Link, Monitor, Platform, Promotion, Setting, Share, Tickets, Timer } from "@element-plus/icons-vue"

interface MetricItem {
  label: string
  value: string
  note: string
}

interface ProductItem {
  name: string
  version: string
  summary: string
  tags: string[]
  primaryLabel: string
  primaryUrl: string
  secondaryLabel: string
  secondaryUrl: string
}

interface CapabilityGroup {
  title: string
  icon: Component
  items: string[]
}

interface LinkItem {
  label: string
  url: string
  icon: Component
}

const metrics: MetricItem[] = [
  { label: "后端基线", value: "6.X", note: "future/6.X 接口契约" },
  { label: "前端架构", value: "v3", note: "保留当前项目组织方式" },
  { label: "登录链路", value: "OK", note: "auth / user / router 已联通" },
  { label: "迁移策略", value: "MVP", note: "先保证首页入口稳定" }
]

const products: ProductItem[] = [
  {
    name: "RuoYi-Vue-Plus",
    version: "v6.0.0",
    summary: "当前后端基线，提供认证、权限、动态菜单、监控、工作流、代码生成等后台核心能力。",
    tags: ["Spring Boot", "Sa-Token", "MyBatis-Plus", "SpringDoc"],
    primaryLabel: "源码",
    primaryUrl: "https://github.com/dromara/RuoYi-Vue-Plus",
    secondaryLabel: "更新日志",
    secondaryUrl: "https://plus-doc.dromara.org/#/ruoyi-vue-plus/changlog"
  },
  {
    name: "plus-ui",
    version: "6.X reference",
    summary: "仅作为接口与业务范围参考，页面实现继续落在当前 v3-admin-vite 的目录、组件和状态模型里。",
    tags: ["Vue 3", "Element Plus", "Pinia", "Dynamic Router"],
    primaryLabel: "文档",
    primaryUrl: "https://plus-doc.dromara.org",
    secondaryLabel: "演示",
    secondaryUrl: "https://plus-doc.dromara.org/#/common/demo_system"
  }
]

const capabilityGroups: CapabilityGroup[] = [
  {
    title: "基础平台",
    icon: Platform,
    items: ["用户、角色、菜单、部门等系统管理能力", "Sa-Token 登录态与按钮权限", "动态路由由后端菜单驱动"]
  },
  {
    title: "运维支撑",
    icon: Monitor,
    items: ["登录日志、操作日志、在线用户", "缓存、服务监控、任务调度", "接口文档与代码生成辅助开发"]
  },
  {
    title: "业务扩展",
    icon: Share,
    items: ["工作流与业务审批入口", "OSS 文件资源管理", "保持前端模块按 6.X 后端实际字段收敛"]
  }
]

const quickLinks: LinkItem[] = [
  { label: "接口文档", url: "/api/v1/swagger-ui/index.html", icon: Document },
  { label: "Plus 文档", url: "https://plus-doc.dromara.org", icon: Link },
  { label: "源码仓库", url: "https://github.com/dromara/RuoYi-Vue-Plus", icon: Connection }
]

function goTarget(url: string) {
  window.open(url, "_blank")
}
</script>

<template>
  <div class="dashboard-page">
    <section class="overview-panel">
      <div class="overview-copy">
        <div class="eyebrow">
          <el-icon><Promotion /></el-icon>
          <span>RuoYi-Vue-Plus 6.X Frontend Migration</span>
        </div>
        <h1>控制台</h1>
        <p>
          当前前端以 v3-admin-vite 为主架构，按 6.X 后端接口逐步收敛认证、权限、菜单与业务页面。
          首页先承担状态确认、资料入口和迁移范围提示，不引入额外后端负担。
        </p>
        <div class="overview-actions">
          <el-button type="primary" :icon="Document" @click="goTarget('/api/v1/swagger-ui/index.html')">
            接口文档
          </el-button>
          <el-button :icon="Link" @click="goTarget('https://plus-doc.dromara.org/#/ruoyi-vue-plus/changlog')">
            更新日志
          </el-button>
        </div>
      </div>

      <div class="metric-grid">
        <article v-for="item in metrics" :key="item.label" class="metric-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <p>{{ item.note }}</p>
        </article>
      </div>
    </section>

    <section class="content-grid">
      <div class="main-column">
        <el-card shadow="never" class="dashboard-card">
          <template #header>
            <div class="card-header">
              <div>
                <span>项目矩阵</span>
                <p>参考 6.X 原版首页的信息组织，保留当前前端实现风格。</p>
              </div>
              <el-icon><Tickets /></el-icon>
            </div>
          </template>

          <div class="product-list">
            <article v-for="product in products" :key="product.name" class="product-item">
              <div class="product-main">
                <div>
                  <div class="product-title">
                    <h2>{{ product.name }}</h2>
                    <el-tag effect="plain" type="primary">{{ product.version }}</el-tag>
                  </div>
                  <p>{{ product.summary }}</p>
                </div>
                <div class="product-actions">
                  <el-button type="primary" plain :icon="Link" @click="goTarget(product.primaryUrl)">
                    {{ product.primaryLabel }}
                  </el-button>
                  <el-button plain @click="goTarget(product.secondaryUrl)">
                    {{ product.secondaryLabel }}
                  </el-button>
                </div>
              </div>
              <div class="tag-row">
                <el-tag v-for="tag in product.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
              </div>
            </article>
          </div>
        </el-card>

        <el-card shadow="never" class="dashboard-card">
          <template #header>
            <div class="card-header">
              <div>
                <span>能力地图</span>
                <p>先按 6.X 后端真实能力推进，删除后端已不存在的前端字段和入口。</p>
              </div>
              <el-icon><Setting /></el-icon>
            </div>
          </template>

          <div class="capability-grid">
            <article v-for="group in capabilityGroups" :key="group.title" class="capability-item">
              <div class="capability-title">
                <el-icon><component :is="group.icon" /></el-icon>
                <h3>{{ group.title }}</h3>
              </div>
              <ul>
                <li v-for="item in group.items" :key="item">{{ item }}</li>
              </ul>
            </article>
          </div>
        </el-card>
      </div>

      <aside class="side-column">
        <el-card shadow="never" class="dashboard-card compact-card">
          <template #header>
            <div class="card-header compact">
              <span>快速入口</span>
              <el-icon><Link /></el-icon>
            </div>
          </template>
          <div class="quick-list">
            <button v-for="item in quickLinks" :key="item.label" type="button" @click="goTarget(item.url)">
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </button>
          </div>
        </el-card>

        <el-card shadow="never" class="dashboard-card compact-card">
          <template #header>
            <div class="card-header compact">
              <span>迁移节奏</span>
              <el-icon><Timer /></el-icon>
            </div>
          </template>
          <ol class="timeline-list">
            <li>
              <strong>阶段一</strong>
              <span>后端 ry-vue2 演示包已保留，dev 配置切到 ry-vue。</span>
            </li>
            <li>
              <strong>阶段二</strong>
              <span>登录、用户信息、动态菜单接口已按 6.X 对齐。</span>
            </li>
            <li>
              <strong>阶段三</strong>
              <span>首页进入可用状态，后续页面按模块继续迁移。</span>
            </li>
          </ol>
        </el-card>
      </aside>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
}

.overview-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
  gap: 18px;
  min-height: 250px;
  padding: 28px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(64, 158, 255, 0.10), transparent 42%),
    var(--el-bg-color);
}

.overview-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;

  h1 {
    margin: 12px 0 10px;
    color: var(--el-text-color-primary);
    font-size: 34px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 0;
  }

  p {
    max-width: 780px;
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 15px;
    line-height: 1.8;
  }
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.overview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 105px;
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);

  span {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  strong {
    margin-top: 8px;
    color: var(--el-text-color-primary);
    font-size: 26px;
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    margin: 10px 0 0;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.5;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
}

.main-column,
.side-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.dashboard-card {
  border-radius: 8px;

  :deep(.el-card__header) {
    padding: 18px 20px;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  span {
    color: var(--el-text-color-primary);
    font-size: 16px;
    font-weight: 700;
  }

  p {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.5;
  }

  .el-icon {
    flex: none;
    color: var(--el-color-primary);
    font-size: 22px;
  }

  &.compact {
    span {
      font-size: 15px;
    }
  }
}

.product-list {
  display: grid;
  gap: 14px;
}

.product-item {
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.product-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.product-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  h2 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 18px;
    line-height: 1.4;
    letter-spacing: 0;
  }
}

.product-item p {
  margin: 10px 0 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.75;
}

.product-actions,
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.product-actions {
  flex: none;
}

.tag-row {
  margin-top: 14px;
}

.capability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.capability-item {
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);

  ul {
    display: grid;
    gap: 10px;
    margin: 14px 0 0;
    padding: 0;
    list-style: none;
  }

  li {
    position: relative;
    padding-left: 14px;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.65;

    &::before {
      position: absolute;
      top: 9px;
      left: 0;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--el-color-primary);
      content: "";
    }
  }
}

.capability-title {
  display: flex;
  align-items: center;
  gap: 10px;

  .el-icon {
    color: var(--el-color-primary);
    font-size: 20px;
  }

  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 15px;
    line-height: 1.4;
  }
}

.quick-list {
  display: grid;
  gap: 10px;

  button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 42px;
    padding: 0 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-extra-light);
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background-color 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    .el-icon {
      flex: none;
      font-size: 18px;
    }

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.timeline-list {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    gap: 6px;
    padding-left: 14px;
    border-left: 2px solid var(--el-color-primary-light-5);
  }

  strong {
    color: var(--el-text-color-primary);
    font-size: 14px;
  }

  span {
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.65;
  }
}

@media (max-width: 1180px) {
  .overview-panel,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .side-column {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .capability-grid,
  .side-column,
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .product-main {
    flex-direction: column;
  }

  .product-actions {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .dashboard-page {
    padding: 12px;
  }

  .overview-panel {
    padding: 20px;
  }

  .overview-copy h1 {
    font-size: 28px;
  }
}
</style>
