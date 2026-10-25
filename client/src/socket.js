let ws = null
let retry = 0

export function connect(url, onMessage, onError, onOpen) {
  if (ws) {
    ws.onclose = null // 防止旧的连接触发重连
    ws.close()
  }

  ws = new WebSocket(url)
  
  ws.onopen = () => { 
    retry = 0 
    console.log('WebSocket 连接成功:', url)
    if (onOpen) onOpen() // 触发连接成功的回调
  }
  
  ws.onmessage = (e) => {
    let msg
    try { msg = JSON.parse(e.data) } catch { return }
    onMessage(msg)
  }
  
  ws.onerror = (e) => {
    if (onError) onError(e)
  }

  ws.onclose = () => {
    const delay = Math.min(1000 * 2 ** retry++, 10000)
    console.log(`连接断开，${delay}ms 后重试...`)
    setTimeout(() => connect(url, onMessage, onError, onOpen), delay)
  }
}

export function send(msg) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(msg))
  } else {
    console.warn('WebSocket 未连接，无法发送消息', msg)
  }
}
