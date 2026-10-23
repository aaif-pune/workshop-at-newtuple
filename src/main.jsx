import { createRoot } from 'react-dom/client'
import App from './App'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import './widgets/widgets.css'
import './style.css'
import '../agent/webmcp' // optional add-on: delete this line (and agent/) for a plain shop
createRoot(document.getElementById('root')).render(<App />)
