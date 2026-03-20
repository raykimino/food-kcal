<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useFoodStore } from '@/stores/food'
import { BarChart3, Download, Upload } from 'lucide-vue-next'
import type { Chart, ChartData, ChartOptions } from 'chart.js'

const foodStore = useFoodStore()
const calorieChart = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null

// 图表数据
const chartData = ref<ChartData<'bar'>>({
  labels: [],
  datasets: [{
    label: '总热量 (kcal)',
    data: [],
    backgroundColor: 'rgba(129,140,248,0.85)',
    borderRadius: 6
  }]
})

const chartOptions = ref<ChartOptions<'bar'>>({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { 
      beginAtZero: true, 
      grid: { color: '#f0f4f8' }, 
      ticks: { color: '#666666' } 
    },
    x: { 
      grid: { display: false }, 
      ticks: { color: '#666666' } 
    }
  }
})

// 统计行数据
const stats = ref({
  total: 0,
  average: 0,
  days: 0
})

// 获取图表数据
const getChartData = () => {
  const dates: string[] = []
  const totals: number[] = []
  
    if (foodStore.chartView === '7d') {
      const base = new Date(foodStore.selectedDate)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(base)
        d.setDate(d.getDate() - i)
        const ds = d.toISOString().split('T')[0]
        dates.push(`${d.getMonth() + 1}/${d.getDate()}`)
        const dayData = foodStore.foodData[ds]
        totals.push(dayData ? 
          parseFloat(dayData.reduce((s: number, f) => s + f.calories, 0).toFixed(1)) : 0)
      }
    } else if (foodStore.chartView === 'week') {
      const base = new Date(foodStore.selectedDate)
      const dow = base.getDay() // 0=Sun
      const monday = new Date(base)
      monday.setDate(base.getDate() - ((dow + 6) % 7))
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const ds = d.toISOString().split('T')[0]
        const labels = ['一','二','三','四','五','六','日']
        dates.push(labels[i])
        const dayData = foodStore.foodData[ds]
        totals.push(dayData ? 
          parseFloat(dayData.reduce((s: number, f) => s + f.calories, 0).toFixed(1)) : 0)
      }
    } else { // month
      const year = new Date(foodStore.selectedDate).getFullYear()
      const month = new Date(foodStore.selectedDate).getMonth()
      const days = new Date(year, month + 1, 0).getDate()
      for (let i = 1; i <= days; i++) {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        dates.push(String(i))
        const dayData = foodStore.foodData[ds]
        totals.push(dayData ? 
          parseFloat(dayData.reduce((s: number, f) => s + f.calories, 0).toFixed(1)) : 0)
      }
    }
  
  return { dates, totals }
}

// 更新统计行
const updateStats = () => {
  const { totals } = getChartData()
  const recordedTotals = totals.filter(v => v > 0)
  const sum = totals.reduce((a, b) => a + b, 0)
  const avg = recordedTotals.length > 0 ? (sum / recordedTotals.length) : 0
  
  stats.value = {
    total: sum,
    average: avg,
    days: recordedTotals.length
  }
}

// 渲染图表
const renderChart = async () => {
  if (!calorieChart.value) return
  
  await nextTick()

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const { dates, totals } = getChartData()
  
  chartData.value.labels = dates
  chartData.value.datasets[0].data = totals
  
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const colors = {
    textColor: isDark ? '#94a3b8' : '#666666',
    gridColor: isDark ? '#334155' : '#f0f4f8'
  }
  
  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: colors.gridColor }, 
        ticks: { color: colors.textColor } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: colors.textColor } 
      }
    }
  }
  
  const ChartLib = await import('chart.js/auto')
  chartInstance = new ChartLib.Chart(calorieChart.value, {
    type: 'bar',
    data: chartData.value,
    options: chartOptions.value
  })
  
  updateStats()
}

// 切换图表视图
const switchChartView = (view: typeof foodStore.chartView) => {
  foodStore.setChartView(view)
}

// 导出数据
const exportData = () => {
  foodStore.exportData()
}

  // 导入数据
const importData = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const jsonData = e.target?.result as string
    if (jsonData) {
      const success = foodStore.importData(jsonData)
      if (success) {
        alert('导入成功！')
        // 触发全局更新
        foodStore.refreshData()
      } else {
        alert('文件格式错误！')
      }
    }
    if (input) {
      input.value = ''
    }
  }
  reader.readAsText(file)
}

// 监听主题变化
const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)')
const handleThemeChange = () => {
  renderChart()
}

const handleImportClick = () => {
  const importInput = document.getElementById('importFile') as HTMLInputElement
  if (importInput) {
    importInput.click()
  }
}

// 初始化和监听
onMounted(() => {
  renderChart()
  darkModeMedia.addEventListener('change', handleThemeChange)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  darkModeMedia.removeEventListener('change', handleThemeChange)
})

// 监听相关状态变化
watch(() => [
  foodStore.chartView,
  foodStore.selectedDate,
  foodStore.foodData
], () => {
  renderChart()
}, { deep: true })
</script>

<template>
  <div class="card">
    <h2><BarChart3 :size="22" /> 热量趋势统计</h2>
    
    <div class="chart-tabs">
      <button 
        class="chart-tab" 
        :class="{ active: foodStore.chartView === '7d' }"
        @click="switchChartView('7d')"
      >
        近7天
      </button>
      <button 
        class="chart-tab" 
        :class="{ active: foodStore.chartView === 'week' }"
        @click="switchChartView('week')"
      >
        本周
      </button>
      <button 
        class="chart-tab" 
        :class="{ active: foodStore.chartView === 'month' }"
        @click="switchChartView('month')"
      >
        本月
      </button>
    </div>
    
    <div class="chart-container">
      <canvas ref="calorieChart" id="calorieChart"></canvas>
    </div>
    
    <div class="stats-row">
      <div class="stat-item">
        <div class="s-val">{{ stats.total.toFixed(0) }}</div>
        <div class="s-label">总热量</div>
      </div>
      <div class="stat-item">
        <div class="s-val">{{ stats.average.toFixed(0) }}</div>
        <div class="s-label">日均热量</div>
      </div>
      <div class="stat-item">
        <div class="s-val">{{ stats.days }}</div>
        <div class="s-label">有记录天数</div>
      </div>
    </div>
    
    <div style="display: flex; gap: 10px; margin-top: 15px;">
      <button @click="exportData" class="btn-small btn-outline" style="flex: 1;">
        <Download :size="16" /> 导出 JSON
      </button>
      <input 
        type="file" 
        id="importFile" 
        accept=".json" 
        style="display: none;" 
        @change="importData"
      />
      <button 
        @click="handleImportClick" 
        class="btn-small btn-success" 
        style="flex: 1;"
      >
        <Upload :size="16" /> 导入 JSON
      </button>
    </div>
  </div>
</template>

<style scoped>
.chart-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 15px;
}

.chart-tab {
  flex: 1;
  padding: 6px 8px;
  font-size: 0.85em;
  border-radius: 8px;
  font-weight: 600;
  background: var(--item-bg);
  color: var(--text-light);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chart-tab:hover {
  background: var(--item-hover);
  transform: none;
  box-shadow: none;
}
.chart-tab.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  box-shadow: none;
}
.chart-tab.active:hover {
  box-shadow: none;
  transform: none;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 15px;
}

.stat-item {
  background: var(--item-bg);
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.stat-item .s-val {
  font-size: 1.1em;
  font-weight: bold;
  color: var(--primary);
}

.stat-item .s-label {
  font-size: 0.78em;
  color: var(--text-light);
  margin-top: 2px;
}

.chart-container {
  position: relative;
  height: 250px;
  width: 100%;
}
</style>