import '../../dist/theme.css'
import './style.css'

const query = new URLSearchParams(location.search)
document.documentElement.dataset.theme = query.get('theme') ?? 'light'
if (query.get('impl') === 'react') await import('./react')
else await import('./vue')
document.documentElement.dataset.ready = 'true'
