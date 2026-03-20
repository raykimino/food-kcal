import type { App } from 'vue'
import { 
  Apple,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Plus,
  Save,
  X,
  Star,
  ChevronDown,
  PieChart,
  CheckCircle,
  Target,
  Utensils,
  Copy,
  CheckSquare,
  Coffee,
  UtensilsCrossed,
  MoonStar,
  Cookie,
  Pencil,
  Trash2,
  BarChart3,
  Download,
  Upload
} from 'lucide-vue-next'

export function createIcons(app: App) {
  app.component('AppleIcon', Apple)
  app.component('CalendarDaysIcon', CalendarDays)
  app.component('ChevronLeftIcon', ChevronLeft)
  app.component('ChevronRightIcon', ChevronRight)
  app.component('PenLineIcon', PenLine)
  app.component('PlusIcon', Plus)
  app.component('SaveIcon', Save)
  app.component('XIcon', X)
  app.component('StarIcon', Star)
  app.component('ChevronDownIcon', ChevronDown)
  app.component('PieChartIcon', PieChart)
  app.component('CheckCircleIcon', CheckCircle)
  app.component('TargetIcon', Target)
  app.component('UtensilsIcon', Utensils)
  app.component('CopyIcon', Copy)
  app.component('CheckSquareIcon', CheckSquare)
  app.component('CoffeeIcon', Coffee)
  app.component('UtensilsCrossedIcon', UtensilsCrossed)
  app.component('MoonStarIcon', MoonStar)
  app.component('CookieIcon', Cookie)
  app.component('PencilIcon', Pencil)
  app.component('Trash2Icon', Trash2)
  app.component('BarChart3Icon', BarChart3)
  app.component('DownloadIcon', Download)
  app.component('UploadIcon', Upload)
}