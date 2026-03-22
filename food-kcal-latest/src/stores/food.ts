import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FoodItem, FavoriteFood, FoodData, MealType, ChartView } from '@/types'

export const useFoodStore = defineStore('food', () => {
  // 状态
  const foodData = ref<FoodData>({})
  const dailyGoal = ref<number>(parseInt(localStorage.getItem('foodTrackerGoal') || '2000'))
  const favorites = ref<FavoriteFood[]>([])
  const selectedDate = ref<string>('')
  
  // 初始化 selectedDate
  const initSelectedDate = () => {
    const date = new Date().toISOString().split('T')[0]
    selectedDate.value = date || '2025-03-20'
  }
  const currentMonth = ref<number>(new Date().getMonth())
  const currentYear = ref<number>(new Date().getFullYear())
  const editingId = ref<number | null>(null)
  const editingDate = ref<string | null>(null)
  const batchMode = ref<boolean>(false)
  const batchSelected = ref<Set<string>>(new Set())
  const chartView = ref<ChartView>('7d')
  const macroExpanded = ref<boolean>(false)
  const foodHistoryMap = ref<Record<string, FoodItem>>({})
  const isDataLoaded = ref<boolean>(false)

  // 常量
  const mealTypes = {
    breakfast: { icon: 'Coffee', name: '早餐' },
    lunch: { icon: 'UtensilsCrossed', name: '午餐' },
    dinner: { icon: 'MoonStar', name: '晚餐' },
    snack: { icon: 'Cookie', name: '加餐 / 零食' }
  } as const

  // 计算属性
  const todayStr = computed<string>(() => {
    const date = new Date().toISOString().split('T')[0]
    return date || '2025-03-20'
  })
  const selectedDayData = computed(() => foodData.value[selectedDate.value] || [])
  const isTodaySelected = computed(() => selectedDate.value === todayStr.value)

  // 当前日期汇总
  const dailySummary = computed(() => {
    const data = selectedDayData.value
    return {
      totalCalories: parseFloat(data.reduce((sum, item) => sum + item.calories, 0).toFixed(1)),
      totalProtein: parseFloat(data.reduce((sum, item) => sum + (item.protein || 0), 0).toFixed(1)),
      totalCarbs: parseFloat(data.reduce((sum, item) => sum + (item.carbs || 0), 0).toFixed(1)),
      totalFat: parseFloat(data.reduce((sum, item) => sum + (item.fat || 0), 0).toFixed(1)),
      foodCount: data.length
    }
  })

  // 进度条百分比
  const progressPercentage = computed(() => {
    const percent = (dailySummary.value.totalCalories / dailyGoal.value) * 100
    return Math.min(percent, 100)
  })

  // 进度条颜色类
  const progressBarClass = computed(() => {
    const total = dailySummary.value.totalCalories
    if (total > dailyGoal.value) return 'danger'
    if (total > dailyGoal.value * 0.85) return 'warning'
    return ''
  })

  // 餐段数据
  const mealSections = computed(() => {
    const result: Record<MealType, FoodItem[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    }
    selectedDayData.value.forEach(item => {
      result[item.meal].push(item)
    })
    return result
  })

  // 方法
  const loadFoodData = () => {
    const data = localStorage.getItem('foodTrackerDataV2')
    if (data) {
      foodData.value = JSON.parse(data)
    } else {
      const old = localStorage.getItem('foodTrackerData')
      if (old) {
        const parsed = JSON.parse(old)
        for (const date in parsed) {
          if (Array.isArray(parsed[date])) {
            parsed[date].forEach((item: any) => {
              if (!item.meal) item.meal = 'snack'
            })
          }
        }
        foodData.value = parsed
        saveAllData()
      }
    }
    updateFoodHistoryMap()
    isDataLoaded.value = true
  }

  const saveAllData = () => {
    localStorage.setItem('foodTrackerDataV2', JSON.stringify(foodData.value))
  }

  const saveFoodItem = (food: FoodItem) => {
    if (!foodData.value[food.date]) {
      foodData.value[food.date] = []
    }
    foodData.value[food.date].push(food)
    saveAllData()
    updateFoodHistoryMap()
  }

  const updateFoodItem = (id: number, date: string, updates: Partial<FoodItem>) => {
    const dayData = foodData.value[date]
    if (!dayData) return

    const index = dayData.findIndex(f => f.id === id)
    if (index !== -1) {
      foodData.value[date][index] = { ...dayData[index], ...updates }
      saveAllData()
      updateFoodHistoryMap()
    }
  }

  const deleteFoodItem = (id: number, date: string) => {
    if (!foodData.value[date]) return

    foodData.value[date] = foodData.value[date].filter(f => f.id !== id)
    if (foodData.value[date].length === 0) {
      delete foodData.value[date]
    }
    saveAllData()
    updateFoodHistoryMap()
  }

  const deleteSelectedItems = () => {
    batchSelected.value.forEach(key => {
      const parts = key.split('|')
      if (parts.length === 2) {
        const [id, date] = parts
        const numId = parseInt(id)
        if (date && foodData.value[date]) {
          foodData.value[date] = foodData.value[date].filter(f => f.id !== numId)
          if (foodData.value[date].length === 0) {
            delete foodData.value[date]
          }
        }
      }
    })
    batchSelected.value.clear()
    batchMode.value = false
    saveAllData()
    updateFoodHistoryMap()
  }

  const loadFavorites = () => {
    const raw = localStorage.getItem('foodTrackerFavorites')
    favorites.value = raw ? JSON.parse(raw) : []
  }

  const saveFavorites = () => {
    localStorage.setItem('foodTrackerFavorites', JSON.stringify(favorites.value))
  }

  const addFavorite = (fav: FavoriteFood) => {
    if (favorites.value.find(f => f.name === fav.name)) {
      throw new Error(`"${fav.name}" 已在收藏夹中`)
    }
    favorites.value.push(fav)
    saveFavorites()
  }

  const removeFavorite = (name: string) => {
    favorites.value = favorites.value.filter(f => f.name !== name)
    saveFavorites()
  }

  const setDailyGoal = (goal: number) => {
    if (goal > 0) {
      dailyGoal.value = goal
      localStorage.setItem('foodTrackerGoal', goal.toString())
    }
  }

  const selectDate = (date: string) => {
    selectedDate.value = date
    const d = new Date(date)
    currentYear.value = d.getFullYear()
    currentMonth.value = d.getMonth()
    batchSelected.value.clear()
    if (!editingId.value) {
      // 重置编辑状态
      editingId.value = null
      editingDate.value = null
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      currentMonth.value--
      if (currentMonth.value < 0) {
        currentMonth.value = 11
        currentYear.value--
      }
    } else {
      currentMonth.value++
      if (currentMonth.value > 11) {
        currentMonth.value = 0
        currentYear.value++
      }
    }
  }

  const toggleBatchMode = () => {
    batchMode.value = !batchMode.value
    if (!batchMode.value) {
      batchSelected.value.clear()
    }
  }

  const toggleItemSelect = (key: string) => {
    if (batchSelected.value.has(key)) {
      batchSelected.value.delete(key)
    } else {
      batchSelected.value.add(key)
    }
  }

  const selectAllItems = () => {
    selectedDayData.value.forEach(item => {
      batchSelected.value.add(`${item.id}|${item.date}`)
    })
  }

  const setEditingItem = (id: number | null, date: string | null) => {
    editingId.value = id
    editingDate.value = date
  }

  const setChartView = (view: ChartView) => {
    chartView.value = view
  }

  const toggleMacroExpanded = () => {
    macroExpanded.value = !macroExpanded.value
  }

  const updateFoodHistoryMap = () => {
    const map: Record<string, FoodItem> = {}
    for (const date in foodData.value) {
      foodData.value[date].forEach(item => {
        map[item.name] = item
      })
    }
    foodHistoryMap.value = map
  }

  const cloneFoodItem = (item: FoodItem) => {
    const clonedItem: FoodItem = {
      ...item,
      id: Date.now() + Math.floor(Math.random() * 100000),
      date: selectedDate.value
    }
    saveFoodItem(clonedItem)
  }

  const copyFromDate = (srcDate: string) => {
    const srcItems = foodData.value[srcDate]
    if (!srcItems || srcItems.length === 0) {
      throw new Error(`${srcDate} 暂无记录`)
    }

    const targetDate = selectedDate.value
    if (!foodData.value[targetDate]) {
      foodData.value[targetDate] = []
    }

    const targetNames = new Set(foodData.value[targetDate].map(item => item.name))

    srcItems.forEach(item => {
      if (targetNames.has(item.name)) {
        return
      }
      if (foodData.value[targetDate]) {
        foodData.value[targetDate].push({
          ...item,
          id: Date.now() + Math.floor(Math.random() * 100000),
          date: targetDate
        })
      }
    })

    saveAllData()
    updateFoodHistoryMap()
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(foodData.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `food-tracker-${todayStr.value}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData)
      if (data && typeof data === 'object') {
        for (const date in data) {
          if (Array.isArray(data[date])) {
            data[date].forEach((item: any) => {
              if (!item.meal) item.meal = 'snack'
            })
          }
        }
        foodData.value = data
        saveAllData()
        updateFoodHistoryMap()
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const refreshData = () => {
    updateFoodHistoryMap()
  }

  // 初始化
  initSelectedDate()
  loadFoodData()
  loadFavorites()

  return {
    // 状态
    foodData,
    dailyGoal,
    favorites,
    selectedDate,
    currentMonth,
    currentYear,
    editingId,
    editingDate,
    batchMode,
    batchSelected,
    chartView,
    macroExpanded,
    foodHistoryMap,
    isDataLoaded,

    // 常量
    mealTypes,
    todayStr,

    // 计算属性
    selectedDayData,
    isTodaySelected,
    dailySummary,
    progressPercentage,
    progressBarClass,
    mealSections,

    // 方法
    loadFoodData,
    saveFoodItem,
    updateFoodItem,
    deleteFoodItem,
    deleteSelectedItems,
    addFavorite,
    removeFavorite,
    setDailyGoal,
    selectDate,
    navigateMonth,
    toggleBatchMode,
    toggleItemSelect,
    selectAllItems,
    setEditingItem,
    setChartView,
    toggleMacroExpanded,
    cloneFoodItem,
    copyFromDate,
    exportData,
    importData,
    refreshData
  }
})