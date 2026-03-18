import { createContext, useState, useCallback, type ReactNode } from 'react'
import { createConnectPayload, createSignPayload, getPayloadResult } from '../utils/api'

interface WalletContextType {
  address: string | null
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  signTransaction: (txJson: Record<string, unknown>) => Promise<string | null>
}

export const WalletContext = createContext<WalletContextType>({
  address: null,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  signTransaction: async () => null,
})

const STORAGE_KEY = 'donos_wallet_address'

async function pollPayloadResult(uuid: string, websocketUrl: string | null): Promise<{ account?: string; txid?: string } | null> {
  // Try WebSocket first for real-time updates
  if (websocketUrl) {
    return new Promise((resolve) => {
      const ws = new WebSocket(websocketUrl)
      const timeout = setTimeout(() => { ws.close(); resolve(null) }, 120000)

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.signed === true || msg.payload_uuidv4) {
            clearTimeout(timeout)
            ws.close()
            // Get the final result from backend
            const result = await getPayloadResult(uuid)
            if (result.signed && result.account) {
              resolve({ account: result.account, txid: result.txid || undefined })
            } else {
              resolve(null)
            }
          } else if (msg.signed === false) {
            clearTimeout(timeout)
            ws.close()
            resolve(null)
          }
        } catch {
          // ignore parse errors
        }
      }
      ws.onerror = () => { clearTimeout(timeout); resolve(null) }
    })
  }

  // Fallback: poll the backend every 3 seconds
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const result = await getPayloadResult(uuid)
    if (result.resolved || result.cancelled) {
      if (result.signed && result.account) {
        return { account: result.account, txid: result.txid || undefined }
      }
      return null
    }
  }
  return null
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY)
  })
  const [connecting, setConnecting] = useState(false)

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      // Create a SignIn payload via backend
      const payload = await createConnectPayload()

      // Open Xaman (deeplink on mobile, QR on desktop)
      if (payload.deeplink) {
        window.open(payload.deeplink, '_blank')
      }

      // Poll for result
      const result = await pollPayloadResult(payload.uuid, payload.websocket_url)
      if (result?.account) {
        setAddress(result.account)
        localStorage.setItem(STORAGE_KEY, result.account)
      }
    } catch (err) {
      console.error('Wallet connection failed:', err)
      // Fallback to manual input if backend not available
      const addr = window.prompt('Enter your XRPL wallet address (r...):')
      if (addr && addr.startsWith('r') && addr.length >= 25) {
        setAddress(addr)
        localStorage.setItem(STORAGE_KEY, addr)
      }
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const signTransaction = useCallback(async (txJson: Record<string, unknown>): Promise<string | null> => {
    try {
      // Create a sign payload via backend
      const payload = await createSignPayload(txJson)

      if (payload.deeplink) {
        window.open(payload.deeplink, '_blank')
      }

      // Poll for signed result
      const result = await pollPayloadResult(payload.uuid, payload.websocket_url)
      return result?.txid || null
    } catch (err) {
      console.error('Transaction signing failed:', err)
      // Fallback for demo
      const mockHash = `MOCK_${Date.now().toString(16).toUpperCase()}`
      alert(`Demo mode: Transaction would be signed via Xaman.\nMock hash: ${mockHash}`)
      return mockHash
    }
  }, [])

  return (
    <WalletContext.Provider value={{ address, connecting, connect, disconnect, signTransaction }}>
      {children}
    </WalletContext.Provider>
  )
}
