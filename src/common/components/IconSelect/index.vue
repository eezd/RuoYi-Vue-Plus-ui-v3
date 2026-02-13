<script setup lang="ts">
import icons from "./requireIcons"

/**
 * defineProps
 */
// #region defineProps
const { width } = defineProps({
  width: { type: String, default: "400px" }
})
// #endregion

const modelValue = defineModel<any>("modelValue", { required: true })

const visible = ref(false)
const iconNames = ref<any>(icons)

const filterValue = ref("")

/**
 * 筛选图标
 */
function filterIcons() {
  if (filterValue.value) {
    iconNames.value = icons.filter(iconName => iconName.includes(filterValue.value))
  } else {
    iconNames.value = icons
  }
}
/**
 * 选择图标
 * @param iconName 选择的图标名称
 */
function selectedIcon(iconName: string) {
  modelValue.value = iconName
  visible.value = false
}
</script>

<template>
  <div class="relative" :style="{ width }">
    <el-input v-model="modelValue" readonly placeholder="点击选择图标" @click="visible = !visible">
      <template #prepend>
        <SvgIcon :name="modelValue || ''" />
      </template>
    </el-input>

    <el-popover shadow="none" :visible="visible" placement="bottom-end" trigger="click" :width="450">
      <template #reference>
        <div class="cursor-pointer text-[#999] absolute right-[10px] top-0 height-[32px] leading-[32px]" @click="visible = !visible">
          <el-icon v-show="visible">
            <ArrowUpBold />
          </el-icon>
          <el-icon v-show="!visible">
            <ArrowDownBold />
          </el-icon>
        </div>
      </template>

      <el-input v-model="filterValue" class="p-2" placeholder="搜索图标" clearable @input="filterIcons" />

      <el-scrollbar height="w-[200px]">
        <ul class="icon-list">
          <el-tooltip v-for="(iconName, index) in iconNames" :key="index" :content="iconName" placement="bottom" effect="light">
            <li class="icon-item" :class="[{ active: modelValue === iconName }]" @click="selectedIcon(iconName)">
              <SvgIcon color="var(--el-text-color-regular)" :name="iconName || ''" />
            </li>
          </el-tooltip>
        </ul>
      </el-scrollbar>
    </el-popover>
  </div>
</template>

<style lang="scss" scoped>
.el-scrollbar {
  max-height: calc(50vh - 100px) !important;
  overflow-y: auto;
}
.el-divider--horizontal {
  margin: 10px auto !important;
}
.icon-list {
  display: flex;
  flex-wrap: wrap;
  padding-left: 10px;
  margin-top: 10px;

  .icon-item {
    cursor: pointer;
    width: 10%;
    margin: 0 10px 10px 0;
    padding: 5px;
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-items: center;
    border: 1px solid #ccc;
    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      transition: all 0.2s;
      transform: scaleX(1.1);
    }
  }
  .active {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}
</style>
