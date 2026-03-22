<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFoodStore } from '@/stores/food'
import type { FoodItem, FavoriteFood } from '@/types'
import { PenLine, Plus, Save, X, Star, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

const foodStore = useFoodStore()
const toast = useToast()

// 表单数据
const formData = ref<Partial<FoodItem>>({
  id: undefined,
  date: foodStore.selectedDate,
  meal: 'lunch',
  name: '',
  calories: 0,
  protein: undefined,
  carbs: undefined,
  fat: undefined
})

// 表单状态
const foodSuggestions = computed(() => {
  return Object.keys(foodStore.foodHistoryMap)
})

const isEditing = computed(() => foodStore.editingId !== null)

const formTitle = computed(() => isEditing.value ? '编辑记录' : '添加记录')

const submitBtnText = computed(() => isEditing.value ? '保存修改' : '添加记录')

const submitBtnIcon = computed(() => isEditing.value ? Save : Plus)

// 收藏夹相关
const saveToFavorites = () => {
  const name = formData.value.name?.trim()
  const calories = formData.value.calories
  
  if (!name || !calories || calories <= 0) {
    toast.warning('请先填写食物名称和热量')
    return
  }

  try {
    const favorite: FavoriteFood = {
      name,
      calories,
      protein: formData.value.protein,
      carbs: formData.value.carbs,
      fat: formData.value.fat
    }
    foodStore.addFavorite(favorite)
    toast.success(`「${name}」已加入收藏夹`)

    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
  } catch (error: any) {
    toast.error(error.message)
  }
}

const applyFavorite = (name: string) => {
  const fav = foodStore.favorites.find(f => f.name === name)
  if (!fav) return

  formData.value.name = fav.name
  formData.value.calories = fav.calories
  formData.value.protein = fav.protein
  formData.value.carbs = fav.carbs
  formData.value.fat = fav.fat

  if ((fav.protein || fav.carbs || fav.fat) && !foodStore.macroExpanded) {
    foodStore.toggleMacroExpanded()
  }
}

const removeFavorite = (name: string) => {
  foodStore.removeFavorite(name)
}

// 表单操作
const resetForm = () => {
  formData.value = {
    id: null,
    date: foodStore.selectedDate,
    meal: 'lunch',
    name: '',
    calories: 0,
    protein: undefined,
    carbs: undefined,
    fat: undefined
  }
}

const cancelEdit = () => {
  foodStore.setEditingItem(null, null)
  resetForm()
}

// 提交表单
const handleSubmit = (e: Event) => {
  e.preventDefault()
  
  if (!formData.value.name?.trim()) {
    toast.warning('请填写食物名称')
    return
  }
  
  if (!formData.value.calories || formData.value.calories <= 0) {
    toast.warning('请填写有效的热量值')
    return
  }
  
  if (formData.value.calories > 10000) {
    toast.warning('热量值不能超过 10000 kcal')
    return
  }
  
  if (formData.value.protein && (formData.value.protein < 0 || formData.value.protein > 500)) {
    toast.warning('蛋白质值超出合理范围 (0-500g)')
    return
  }
  
  if (formData.value.carbs && (formData.value.carbs < 0 || formData.value.carbs > 1000)) {
    toast.warning('碳水值超出合理范围 (0-1000g)')
    return
  }
  
  if (formData.value.fat && (formData.value.fat < 0 || formData.value.fat > 500)) {
    toast.warning('脂肪值超出合理范围 (0-500g)')
    return
  }

  if ('vibrate' in navigator) {
    navigator.vibrate(40)
  }

  const foodItem: FoodItem = {
    id: formData.value.id || Date.now() + Math.floor(Math.random() * 10000),
    date: formData.value.date || foodStore.selectedDate,
    meal: formData.value.meal || 'lunch',
    name: formData.value.name?.trim() || '',
    calories: formData.value.calories || 0,
    protein: formData.value.protein,
    carbs: formData.value.carbs,
    fat: formData.value.fat
  }

  // 清除值为 0 的宏营养素
  if (!foodItem.protein) delete foodItem.protein
  if (!foodItem.carbs) delete foodItem.carbs
  if (!foodItem.fat) delete foodItem.fat

  if (isEditing.value) {
    foodStore.deleteFoodItem(foodItem.id, foodStore.editingDate!)
    cancelEdit()
    toast.success(`「${foodItem.name}」已更新`)
  } else {
    resetForm()
    toast.success(`已添加「${foodItem.name}」`)
  }

  foodStore.saveFoodItem(foodItem)

  if (foodItem.date !== foodStore.selectedDate) {
    foodStore.selectDate(foodItem.date)
  }
}

// 监听选择日期变化
watch(() => foodStore.selectedDate, (newDate) => {
  if (!isEditing.value) {
    formData.value.date = newDate
  }
})

// 监听食物名称输入，自动填充历史数据
const handleNameInput = () => {
  const name = formData.value.name?.trim()
  if (name && foodStore.foodHistoryMap[name]) {
    const historyItem = foodStore.foodHistoryMap[name]
    formData.value.calories = historyItem.calories
    formData.value.protein = historyItem.protein
    formData.value.carbs = historyItem.carbs
    formData.value.fat = historyItem.fat

    if ((historyItem.protein || historyItem.carbs || historyItem.fat) && !foodStore.macroExpanded) {
      foodStore.toggleMacroExpanded()
    }
  }
}

// 编辑模式设置
watch(() => foodStore.editingId, (editingId) => {
  if (editingId && foodStore.editingDate) {
    const item = foodStore.foodData[foodStore.editingDate]?.find(f => f.id === editingId)
    if (item) {
      formData.value = { ...item }
    }
  }
})
</script>

<template>
  <div class="card" id="formCard">
    <h2><PenLine :size="22" /> <span>{{ formTitle }}</span></h2>
    
    <form @submit="handleSubmit" id="foodForm">
      <div class="form-group">
        <label for="date">日期</label>
        <input 
          type="date" 
          id="date" 
          v-model="formData.date" 
          required
        />
      </div>

      <div class="form-group">
        <label for="meal">餐段</label>
        <select id="meal" v-model="formData.meal">
          <option value="breakfast">早餐</option>
          <option value="lunch">午餐</option>
          <option value="dinner">晚餐</option>
          <option value="snack">加餐 / 零食</option>
        </select>
      </div>

      <!-- 收藏夹快选 -->
      <div class="favorites-section">
        <label style="margin-bottom:6px;">收藏夹快选</label>
        <div class="favorites-chips" id="favChips">
          <span v-if="foodStore.favorites.length === 0" class="fav-empty">
            暂无收藏，填写后点击「加入收藏」
          </span>
          <span 
            v-else
            v-for="fav in foodStore.favorites" 
            :key="fav.name"
            class="fav-chip"
            @click="applyFavorite(fav.name)"
          >
            <span>{{ fav.name }}</span>
            <span 
              class="fav-del" 
              @click.stop="removeFavorite(fav.name)"
              title="移除收藏"
            >
              ×
            </span>
          </span>
        </div>
      </div>

      <div class="form-group">
        <label for="name">食物名称</label>
        <input 
          type="text" 
          id="name" 
          v-model="formData.name" 
          :list="'foodSuggestions' + Date.now()"
          placeholder="例如：米饭、苹果..." 
          required 
          autocomplete="off"
          @input="handleNameInput"
        />
        <datalist :id="'foodSuggestions' + Date.now()">
          <option v-for="suggestion in foodSuggestions" :key="suggestion" :value="suggestion" />
        </datalist>
      </div>

      <div class="form-group">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <label style="margin-bottom:0;">热量 (千卡)</label>
          <button type="button" class="btn-ghost" @click="saveToFavorites">
            <Star :size="13" /> 加入收藏
          </button>
        </div>
        <input 
          type="number" 
          id="calories" 
          v-model.number="formData.calories" 
          min="0" 
          step="0.1" 
          placeholder="例如：250" 
          required
        />
      </div>

      <!-- 营养素展开 -->
      <button type="button" class="macro-toggle" @click="foodStore.toggleMacroExpanded()">
        <component 
          :is="foodStore.macroExpanded ? ChevronDown : ChevronRight" 
          :size="14" 
        /> 
        展开营养素（蛋白质 / 碳水 / 脂肪）
      </button>
      
      <div v-if="foodStore.macroExpanded" id="macroFields">
        <div class="macro-inputs">
          <div class="form-group">
            <label for="protein">蛋白质 (g)</label>
            <input 
              type="number" 
              id="protein" 
              v-model.number="formData.protein" 
              min="0" 
              step="0.1" 
              placeholder="0"
            />
          </div>
          <div class="form-group">
            <label for="carbs">碳水 (g)</label>
            <input 
              type="number" 
              id="carbs" 
              v-model.number="formData.carbs" 
              min="0" 
              step="0.1" 
              placeholder="0"
            />
          </div>
          <div class="form-group">
            <label for="fat">脂肪 (g)</label>
            <input 
              type="number" 
              id="fat" 
              v-model.number="formData.fat" 
              min="0" 
              step="0.1" 
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 15px;">
        <button type="submit" id="submitBtn" style="flex: 2;">
          <component :is="submitBtnIcon" :size="18" id="submitIcon" /> 
          <span id="submitBtnText">{{ submitBtnText }}</span>
        </button>
        <button 
          type="button" 
          id="cancelEditBtn" 
          class="btn-outline" 
          v-if="isEditing" 
          style="flex: 1;" 
          @click="cancelEdit"
        >
          <X :size="18" /> 取消
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.favorites-section {
  margin-bottom: 10px;
}

.favorites-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-height: 26px;
}

.fav-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  background: var(--item-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 0.78em;
  cursor: pointer;
  color: var(--text-main);
  transition: background 0.2s;
}
.fav-chip:hover {
  background: var(--item-hover);
  border-color: var(--primary);
}
.fav-chip .fav-del {
  color: var(--text-light);
  font-size: 1em;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}
.fav-chip .fav-del:hover {
  color: var(--danger);
}

.fav-empty {
  font-size: 0.78em;
  color: var(--text-light);
  padding: 4px 0;
}

.macro-toggle {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 0.8em;
  padding: 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: none;
}
.macro-toggle:hover {
  background: none;
  transform: none;
  box-shadow: none;
  color: var(--primary);
}

.macro-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 8px;
}
.macro-inputs .form-group {
  margin-bottom: 0;
}
.macro-inputs label {
  font-size: 0.75em;
}
.macro-inputs input {
  padding: 6px 8px;
  font-size: 0.85em;
}

@media (max-width: 400px) {
  .macro-inputs {
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
  }
  
  .macro-inputs label {
    font-size: 0.7em;
  }
  
  .macro-inputs input {
    padding: 5px 6px;
    font-size: 0.8em;
  }
}
</style>