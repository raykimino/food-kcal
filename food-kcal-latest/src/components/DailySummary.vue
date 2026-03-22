<script setup lang="ts">
import { computed } from 'vue'
import { useFoodStore } from '@/stores/food'
import { PieChart, CheckCircle, Target } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import Swal from 'sweetalert2'

const foodStore = useFoodStore()
const toast = useToast()
const emit = defineEmits<{
  finishToday: []
}>()

const selectedDateTitle = computed(() => {
  return foodStore.isTodaySelected ? '今日摄入' : `${foodStore.selectedDate} 摄入`
})

const goalText = computed(() => {
  return `${foodStore.dailySummary.totalCalories} / ${foodStore.dailyGoal} kcal`
})

const setDailyGoal = async () => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  const { value } = await Swal.fire({
    title: '修改每日目标',
    input: 'number',
    inputLabel: '每日热量目标 (kcal)',
    inputValue: foodStore.dailyGoal,
    inputAttributes: { min: '1', step: '1' },
    showCancelButton: true,
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    confirmButtonColor: isDark ? '#818cf8' : '#667eea',
    cancelButtonColor: isDark ? '#475569' : '#666',
    background: isDark ? '#1e293b' : '#fff',
    color: isDark ? '#f8fafc' : '#2c3e50',
    inputValidator: (value) => {
      if (!value || parseInt(value) <= 0) return '请输入有效的热量目标'
    }
  })

  if (value) {
    foodStore.setDailyGoal(parseInt(value))
    toast.success(`每日目标已设为 ${value} kcal`)
  }
}
</script>

<template>
  <div class="card">
    <h2 style="justify-content: space-between;">
      <span style="display:flex;align-items:center;gap:8px;">
        <PieChart :size="22" /> 
        <span>{{ selectedDateTitle }}</span>
      </span>
      <button 
        class="goal-edit-btn" 
        @click="emit('finishToday')" 
        style="color:var(--success);display:flex;align-items:center;gap:4px;"
      >
        <CheckCircle :size="18" /> 完成打卡
      </button>
    </h2>
    
    <div class="summary">
      <div class="summary-item">
        <div class="value">{{ foodStore.dailySummary.totalCalories }}</div>
        <div class="label">总热量 (kcal)</div>
      </div>
      <div class="summary-item">
        <div class="value">{{ foodStore.dailySummary.foodCount }}</div>
        <div class="label">记录条数</div>
      </div>
    </div>
    
    <!-- 三大营养素汇总 -->
    <div class="macro-summary">
      <div class="macro-item">
        <div class="m-val">{{ foodStore.dailySummary.totalProtein.toFixed(1) }}g</div>
        <div class="m-label">蛋白质</div>
      </div>
      <div class="macro-item">
        <div class="m-val">{{ foodStore.dailySummary.totalCarbs.toFixed(1) }}g</div>
        <div class="m-label">碳水化合物</div>
      </div>
      <div class="macro-item">
        <div class="m-val">{{ foodStore.dailySummary.totalFat.toFixed(1) }}g</div>
        <div class="m-label">脂肪</div>
      </div>
    </div>
    
    <div class="progress-wrapper">
      <div class="goal-header">
        <span>{{ goalText }}</span>
        <button class="goal-edit-btn" @click="setDailyGoal">
          <Target :size="14" /> 修改目标
        </button>
      </div>
      <div class="progress-bg">
        <div 
          class="progress-fill" 
          :class="foodStore.progressBarClass"
          :style="{ width: `${foodStore.progressPercentage}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.summary-item {
  background: var(--item-bg);
  padding: 15px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.summary-item .value {
  font-size: 1.8em;
  font-weight: bold;
  color: var(--primary);
}

.summary-item .label {
  font-size: 0.85em;
  color: var(--text-light);
  margin-top: 5px;
}

.macro-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.macro-item {
  background: var(--item-bg);
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.macro-item .m-val {
  font-size: 1.2em;
  font-weight: bold;
  color: var(--secondary);
}

.macro-item .m-label {
  font-size: 0.78em;
  color: var(--text-light);
  margin-top: 3px;
}

.progress-wrapper {
  padding: 0 5px;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85em;
  color: var(--text-light);
  margin-bottom: 6px;
}

.goal-edit-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--primary);
  width: auto;
  font-size: 1em;
  box-shadow: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.goal-edit-btn:hover {
  background: none;
  transform: none;
  box-shadow: none;
  text-decoration: underline;
}

.progress-bg {
  background: var(--border-color);
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  background: var(--success);
  height: 100%;
  width: 0%;
  transition: width 0.5s ease-out, background-color 0.3s;
}
.progress-fill.warning {
  background: var(--warning);
}
.progress-fill.danger {
  background: var(--danger);
}
</style>