let ws = null
let retry = 0

export function connect(url, onMessage) {
  ws = new WebSocket(url)
  ws.onopen = () => { retry = 0 }
  ws.onmessage = (e) => {
    let msg
    try { msg = JSON.parse(e.data) } catch { return }
    onMessage(msg)
  }
  ws.onclose = () => {
    const delay = Math.min(1000 * 2 ** retry++, 10000)
    setTimeout(() => connect(url, onMessage), delay)
  }
}

export function send(msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg))
}