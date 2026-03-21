<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useFoodStore } from '@/stores/food'
import Calendar from '@/components/Calendar.vue'
import FoodForm from '@/components/FoodForm.vue'
import DailySummary from '@/components/DailySummary.vue'
import MealDetails from '@/components/MealDetails.vue'
import ChartStats from '@/components/ChartStats.vue'
import Loading from '@/components/Loading.vue'
import { Apple } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

const foodStore = useFoodStore()
const toast = useToast()
const vibrateSupported = ref(false)
const isAppReady = ref(false)

// 监听数据加载完成
watch(() => foodStore.isDataLoaded, (loaded) => {
  if (loaded) {
    setTimeout(() => {
      isAppReady.value = true
    }, 100) // 小延迟确保所有组件都准备好了
  }
}, { immediate: true })

const themeColors = computed(() => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return {
    primary: isDark ? '#818cf8' : '#667eea',
    secondary: isDark ? '#a78bfa' : '#764ba2',
    bgColor: isDark ? '#0f172a' : '#f4f7f8',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    textMain: isDark ? '#f8fafc' : '#2c3e50',
    textLight: isDark ? '#94a3b8' : '#666666',
    borderColor: isDark ? '#334155' : '#e0e0e0',
    danger: '#ff4757',
    success: '#2ed573',
    warning: '#ffa502',
    inputBg: isDark ? '#0f172a' : '#fafbfc',
    itemBg: isDark ? '#0f172a' : '#f8fafc',
    itemHover: isDark ? '#334155' : '#f1f5f9'
  }
})

const cssVars = computed(() => ({
  '--primary': themeColors.value.primary,
  '--secondary': themeColors.value.secondary,
  '--bg-color': themeColors.value.bgColor,
  '--card-bg': themeColors.value.cardBg,
  '--text-main': themeColors.value.textMain,
  '--text-light': themeColors.value.textLight,
  '--border-color': themeColors.value.borderColor,
  '--danger': themeColors.value.danger,
  '--success': themeColors.value.success,
  '--warning': themeColors.value.warning,
  '--input-bg': themeColors.value.inputBg,
  '--item-bg': themeColors.value.itemBg,
  '--item-hover': themeColors.value.itemHover
}))

onMounted(() => {
  vibrateSupported.value = 'vibrate' in navigator
  
  if ('serviceWorker' in navigator) {
    // 在生产环境才启用 Service Worker
    if (import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker 注册成功:', registration.scope)
        }).catch(error => {
          console.error('Service Worker 注册失败:', error)
        })
      })
    } else {
      // 开发环境：注销所有已注册的 Service Worker
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister()
        }
      })
    }
  }
  
  const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)')
  darkModeMedia.addEventListener('change', () => {
    document.documentElement.style.cssText = Object.entries(cssVars.value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(';')
  })
})

const finishToday = () => {
  const dayData = foodStore.selectedDayData
  if (dayData.length === 0) {
    toast.warning('今天还没有记录哦，先去添加食物吧！')
    return
  }
  
  if (vibrateSupported.value) {
    navigator.vibrate([50, 50, 50])
  }
  
  import('canvas-confetti').then((confetti) => {
    const end = Date.now() + 3000
    const frame = () => {
      confetti.default({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#667eea','#764ba2','#2ed573','#ff4757','#ffa502'] })
      confetti.default({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#667eea','#764ba2','#2ed573','#ff4757','#ffa502'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  })
}
</script>

<template>
  <div>
    <Loading v-if="!isAppReady" />
    
    <div v-if="isAppReady" class="container" :style="cssVars">
      <h1><Apple :size="32" /> 食物热量记录</h1>
      
      <div class="app-layout">
        <!-- 左侧 -->
        <div class="left-col">
          <Calendar />
          <FoodForm />
        </div>

        <!-- 右侧 -->
        <div class="right-col">
          <DailySummary @finish-today="finishToday" />
          <MealDetails />
          <ChartStats />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: var(--text-main);
  margin-bottom: 30px;
  font-size: 2.2em;
  font-weight: 800;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.app-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 768px) {
  .app-layout {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}
</style>

<style>
/* 全局样式 */
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --bg-color: #f4f7f8;
  --card-bg: #ffffff;
  --text-main: #2c3e50;
  --text-light: #666666;
  --border-color: #e0e0e0;
  --danger: #ff4757;
  --success: #2ed573;
  --warning: #ffa502;
  --input-bg: #fafbfc;
  --item-bg: #f8fafc;
  --item-hover: #f1f5f9;
  --btn-header-bg: #f0f4f8;
  --btn-header-hover: #e2e8f0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary: #818cf8;
    --secondary: #a78bfa;
    --bg-color: #0f172a;
    --card-bg: #1e293b;
    --text-main: #f8fafc;
    --text-light: #94a3b8;
    --border-color: #334155;
    --input-bg: #0f172a;
    --item-bg: #0f172a;
    --item-hover: #334155;
    --btn-header-bg: #334155;
    --btn-header-hover: #475569;
  }
  .card { 
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
    border: 1px solid rgba(255,255,255,0.05); 
  }
}

* { 
  margin: 0; 
  padding: 0; 
  box-sizing: border-box; 
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg-color); 
  min-height: 100vh; 
  padding: 20px;
  color: var(--text-main); 
  transition: background-color 0.3s, color 0.3s;
}

.card {
  background: var(--card-bg); 
  border-radius: 16px; 
  padding: 20px;
  margin-bottom: 20px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.04); 
  transition: background-color 0.3s, border-color 0.3s;
}

.card h2 { 
  font-size: 1.2em; 
  margin-bottom: 15px; 
  color: var(--text-main); 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}
.card h2 svg { 
  width: 22px; 
  height: 22px; 
  color: var(--primary); 
}

.form-group { 
  margin-bottom: 15px; 
}
label { 
  display: block; 
  margin-bottom: 6px; 
  color: var(--text-light); 
  font-size: 0.9em; 
  font-weight: 600; 
}
input, select {
  width: 100%; 
  padding: 10px 12px; 
  border: 1px solid var(--border-color);
  border-radius: 8px; 
  font-size: 1em; 
  background: var(--input-bg);
  transition: all 0.3s; 
  color: var(--text-main); 
  color-scheme: dark light;
}
input:focus, select:focus {
  outline: none; 
  border-color: var(--primary); 
  background: var(--card-bg);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

button {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white; 
  border: none; 
  padding: 12px 20px; 
  border-radius: 8px;
  font-size: 1em; 
  font-weight: 600; 
  cursor: pointer; 
  width: 100%;
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 8px;
}
button:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3); 
}
button svg { 
  width: 18px; 
  height: 18px; 
}
.btn-small { 
  padding: 6px 12px; 
  font-size: 0.85em; 
  width: auto; 
  border-radius: 6px; 
}
.btn-danger { 
  background: var(--danger); 
}
.btn-danger:hover { 
  box-shadow: 0 5px 15px rgba(255, 71, 87, 0.3); 
}
.btn-success { 
  background: var(--success); 
}
.btn-success:hover { 
  box-shadow: 0 2px 8px rgba(46, 213, 115, 0.3); 
}
.btn-outline { 
  background: var(--card-bg); 
  color: var(--text-main); 
  border: 1px solid var(--border-color); 
}
.btn-outline:hover { 
  background: var(--btn-header-hover); 
  box-shadow: none; 
}
.btn-ghost {
  background: none; 
  border: none; 
  padding: 0; 
  color: var(--text-light);
  width: auto; 
  font-size: 0.85em; 
  box-shadow: none; 
  cursor: pointer;
  display: inline-flex; 
  align-items: center; 
  gap: 4px;
}
.btn-ghost:hover {
  background: none;
  transform: none;
  box-shadow: none;
  color: var(--primary);
}

/* 修复全局 button 样式污染 vue-toastification 内部按钮 */
.Vue-Toastification__close-button {
  width: auto !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 6px !important;
  display: inline-flex !important;
  align-items: center !important;
  flex-shrink: 0 !important;
  transform: none !important;
  min-width: unset !important;
}
.Vue-Toastification__close-button:hover {
  transform: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
</style>