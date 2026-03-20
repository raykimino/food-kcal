import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createIcons } from '@/utils/icons'

const app = createApp(App)

app.use(createPinia())

// 注册 Lucide 图标
createIcons(app)

app.mount('#app')