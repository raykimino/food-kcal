// 食物条目类型
export interface FoodItem {
  id: number
  date: string
  meal: MealType
  name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
}

// 餐段类型
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

// 餐段配置
export interface MealConfig {
  icon: string
  name: string
}

// 收藏夹食物
export interface FavoriteFood {
  name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
}

// 图表视图类型
export type ChartView = '7d' | 'week' | 'month'

// 本地存储数据结构
export interface FoodData {
  [date: string]: FoodItem[]
}