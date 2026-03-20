<script setup lang="ts">
import { computed } from 'vue'
import { useFoodStore } from '@/stores/food'
import type { FoodItem, MealType } from '@/types'
import { 
  Utensils, 
  Copy, 
  CheckSquare, 
  Coffee, 
  UtensilsCrossed, 
  MoonStar, 
  Cookie,
  Pencil,
  Trash2,
  X
} from 'lucide-vue-next'

const foodStore = useFoodStore()

// 复制记录
const copyFromDate = () => {
  const srcDate = prompt('请输入要复制的日期（格式 YYYY-MM-DD）：')
  if (!srcDate) return
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(srcDate)) {
    alert('日期格式不正确')
    return
  }
  
  if (srcDate === foodStore.selectedDate) {
    alert('不能复制到同一天')
    return
  }
  
  try {
    foodStore.copyFromDate(srcDate)
    
    if ('vibrate' in navigator) {
      navigator.vibrate(40)
    }
  } catch (error: any) {
    alert(error.message)
  }
}

// 快速克隆
const cloneFoodItem = (item: FoodItem) => {
  foodStore.cloneFoodItem(item)
  
  if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
}

// 编辑食物
const editFoodItem = (id: number, date: string) => {
  foodStore.setEditingItem(id, date)
  
  if (window.innerWidth <= 768) {
    document.getElementById('formCard')?.scrollIntoView({ behavior: 'smooth' })
  }
}

// 删除食物
const deleteFoodItem = (id: number, date: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
    foodStore.deleteFoodItem(id, date)
  }
}

// 餐段图标映射
const mealIcons: Record<MealType, any> = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  dinner: MoonStar,
  snack: Cookie
}

// 批量选择相关
const selectedCount = computed(() => foodStore.batchSelected.size)

const toggleItemSelect = (key: string) => {
  foodStore.toggleItemSelect(key)
}

const selectAllItems = () => {
  foodStore.selectAllItems()
}

const deleteSelectedItems = () => {
  if (foodStore.batchSelected.size === 0) {
    alert('请先选择要删除的记录')
    return
  }
  
  if (!confirm(`确定删除选中的 ${foodStore.batchSelected.size} 条记录？`)) {
    return
  }
  
  if ('vibrate' in navigator) {
    navigator.vibrate([30, 30, 30])
  }
  
  foodStore.deleteSelectedItems()
}
</script>

<template>
  <div class="card">
    <div class="detail-header">
      <h2 style="margin-bottom:0;"><Utensils :size="22" /> 饮食明细</h2>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn-small btn-outline" @click="copyFromDate" title="复制其他日期的记录">
          <Copy :size="14" /> 复制记录
        </button>
        <button 
          class="btn-small btn-outline" 
          id="batchToggleBtn" 
          @click="foodStore.toggleBatchMode()"
          :style="{
            background: foodStore.batchMode ? 'linear-gradient(135deg,var(--primary),var(--secondary))' : '',
            color: foodStore.batchMode ? 'white' : ''
          }"
        >
          <CheckSquare :size="14" /> 批量选择
        </button>
      </div>
    </div>
    
    <div v-if="foodStore.batchMode" id="batchBar" class="batch-bar">
      <button class="btn-small btn-outline" @click="selectAllItems">全选</button>
      <button class="btn-small btn-danger" @click="deleteSelectedItems">
        删除所选 ({{ selectedCount }})
      </button>
      <button class="btn-small btn-outline" @click="foodStore.toggleBatchMode()">
        <X :size="14" /> 取消
      </button>
    </div>
    
    <div id="mealsContainer">
      <div 
        v-for="mealType in Object.keys(foodStore.mealTypes) as MealType[]" 
        :key="mealType"
        class="meal-section"
      >
        <div class="meal-header">
          <div class="meal-title">
            <component :is="mealIcons[mealType]" :size="18" /> 
            {{ foodStore.mealTypes[mealType].name }}
          </div>
          <div class="meal-subtotal">
            <template v-if="foodStore.mealSections[mealType].length > 0">
              {{
                foodStore.mealSections[mealType]
                  .reduce((sum, item) => sum + item.calories, 0)
                  .toFixed(1)
              }} kcal
            </template>
          </div>
        </div>
        
        <div v-if="foodStore.mealSections[mealType].length === 0" class="empty-message">
          暂无记录
        </div>
        
        <div 
          v-else
          v-for="food in foodStore.mealSections[mealType]" 
          :key="food.id"
          :class="[
            'food-item',
            foodStore.batchSelected.has(`${food.id}|${food.date}`) ? 'selected-item' : ''
          ]"
          @click="foodStore.batchMode && toggleItemSelect(`${food.id}|${food.date}`)"
          :style="{ cursor: foodStore.batchMode ? 'pointer' : 'default' }"
        >
          <input 
            v-if="foodStore.batchMode" 
            type="checkbox" 
            class="item-checkbox" 
            :checked="foodStore.batchSelected.has(`${food.id}|${food.date}`)"
            @click.stop="toggleItemSelect(`${food.id}|${food.date}`)"
          />
          
          <div class="food-info">
            <div class="food-name">{{ food.name }}</div>
            <div class="food-cal">{{ food.calories }} kcal</div>
            <div 
              v-if="food.protein || food.carbs || food.fat" 
              class="food-macros"
            >
              蛋白质 {{ food.protein || 0 }}g · 碳水 {{ food.carbs || 0 }}g · 脂肪 {{ food.fat || 0 }}g
            </div>
          </div>
          
          <div v-if="!foodStore.batchMode" class="item-actions">
            <button 
              class="btn-small btn-outline" 
              title="快速复制" 
              @click.stop="cloneFoodItem(food)"
            >
              <Copy :size="14" />
            </button>
            <button 
              class="btn-small btn-outline" 
              @click.stop="editFoodItem(food.id, food.date)"
            >
              <Pencil :size="14" />
            </button>
            <button 
              class="btn-small btn-danger" 
              @click.stop="deleteFoodItem(food.id, food.date)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.batch-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid var(--border-color);
  margin-top: 10px;
}

.meal-section {
  margin-bottom: 20px;
}

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 2px solid var(--btn-header-bg);
  margin-bottom: 10px;
}

.meal-title {
  font-weight: bold;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.meal-subtotal {
  font-size: 0.9em;
  color: var(--text-light);
  font-weight: 500;
}

.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--item-bg);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background 0.2s, border-color 0.2s;
  border: 1px solid transparent;
  gap: 10px;
}
.food-item:hover {
  background: var(--item-hover);
  border-color: var(--border-color);
}
.food-item.selected-item {
  border-color: var(--primary);
  background: rgba(102,126,234,0.06);
}

.food-info {
  flex-grow: 1;
  min-width: 0;
}

.food-name {
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.food-cal {
  color: var(--text-light);
  font-size: 0.9em;
  margin-top: 2px;
}

.food-macros {
  color: var(--text-light);
  font-size: 0.8em;
  margin-top: 2px;
}

.item-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  align-items: center;
}

.empty-message {
  text-align: center;
  color: var(--text-light);
  padding: 20px;
  font-size: 0.9em;
}

.item-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
  accent-color: var(--primary);
}
</style>