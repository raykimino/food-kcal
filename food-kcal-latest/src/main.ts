import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createIcons } from '@/utils/icons'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: false,
  maxToasts: 5
})

// 注册 Lucide 图标
createIcons(app)

app.mount('#app')