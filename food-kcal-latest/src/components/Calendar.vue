<script setup lang="ts">
import { computed } from 'vue'
import { useFoodStore } from '@/stores/food'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const foodStore = useFoodStore()

const calendarDays = computed(() => {
  const year = foodStore.currentYear
  const month = foodStore.currentMonth
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const days = []
  
  // 添加日期头部
  ;['日','一','二','三','四','五','六'].forEach(d => {
    days.push({ type: 'header' as const, text: d })
  })
  
  // 添加空白单元格
  for (let i = 0; i < firstDay; i++) {
    days.push({ type: 'empty' as const })
  }
  
  // 添加日期单元格
  for (let i = 1; i <= daysInMonth; i++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const dayData = foodStore.foodData[date]
    
    days.push({
      type: 'day' as const,
      date,
      day: i,
      isToday: date === foodStore.todayStr,
      isSelected: date === foodStore.selectedDate,
      hasData: dayData && dayData.length > 0
    })
  }
  
  return days
})

const monthYearDisplay = computed(() => {
  return `${foodStore.currentYear}年 ${foodStore.currentMonth + 1}月`
})

const handlePrevMonth = () => {
  foodStore.navigateMonth('prev')
}

const handleNextMonth = () => {
  foodStore.navigateMonth('next')
}

const handleDayClick = (date: string) => {
  foodStore.selectDate(date)
}
</script>

<template>
  <div class="card">
    <h2><CalendarDays :size="22" /> 饮食日历</h2>
    
    <div class="calendar-header">
      <button @click="handlePrevMonth" class="btn-small">
        <ChevronLeft :size="16" />
      </button>
      <span>{{ monthYearDisplay }}</span>
      <button @click="handleNextMonth" class="btn-small">
        <ChevronRight :size="16" />
      </button>
    </div>
    
    <div class="calendar-grid">
      <div 
        v-for="(item, index) in calendarDays" 
        :key="index"
        :class="[
          'calendar-cell',
          item.type === 'header' ? 'calendar-day-header' : '',
          item.type === 'empty' ? 'calendar-day empty' : '',
          item.type === 'day' ? 'calendar-day' : '',
          item.type === 'day' && item.isToday ? 'today' : '',
          item.type === 'day' && item.isSelected ? 'selected' : ''
        ]"
        @click="item.type === 'day' && handleDayClick(item.date)"
      >
        <template v-if="item.type === 'header'">
          {{ item.text }}
        </template>
        <template v-else-if="item.type === 'day'">
          {{ item.day }}
          <div v-if="item.hasData" class="has-data-dot"></div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.calendar-header button {
  width: auto;
  padding: 5px 10px;
  background: var(--btn-header-bg);
  color: var(--text-main);
  box-shadow: none;
}
.calendar-header button:hover {
  background: var(--btn-header-hover);
  transform: none;
  box-shadow: none;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  text-align: center;
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.9em;
  position: relative;
  transition: background 0.2s;
}

.calendar-day-header {
  color: var(--text-light);
  font-weight: bold;
  padding-bottom: 5px;
}

.calendar-day {
  color: var(--text-main);
  cursor: pointer;
}
.calendar-day:hover:not(.empty) {
  background: var(--item-hover);
}
.calendar-day.empty {
  cursor: default;
}
.calendar-day.empty:hover {
  background: transparent;
}
.calendar-day.today {
  font-weight: bold;
  color: var(--primary);
}
.calendar-day.selected {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}
.calendar-day.selected.today {
  color: white;
}

.has-data-dot {
  width: 4px;
  height: 4px;
  background: var(--success);
  border-radius: 50%;
  position: absolute;
  bottom: 4px;
}
.calendar-day.selected .has-data-dot {
  background: white;
}
</style>