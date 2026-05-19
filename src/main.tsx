import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 阻止非目标区域的 drop 默认行为（防止 Electron 打开文件）
// 注意：不阻止 propagation，让 React 合成事件正常触发
document.addEventListener('dragover', (e) => {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}, false)
document.addEventListener('drop', (e) => {
  // 仅阻止默认行为，不阻止冒泡（React onDrop 仍可触发）
  e.preventDefault()
}, false)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
