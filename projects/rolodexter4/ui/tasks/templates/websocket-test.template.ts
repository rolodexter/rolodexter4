// WebSocket Test Utilities
import { vi } from 'vitest'

interface MockWebSocketOptions {
  url: string
  protocols?: string | string[]
  autoConnect?: boolean
  mockConnectionDelay?: number
}

export class MockWebSocket {
  private static instance: MockWebSocket
  public socket: any
  private messageHandlers: ((data: any) => void)[] = []
  private connectionState: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' = 'CLOSED'

  constructor(options: MockWebSocketOptions) {
    this.socket = {
      url: options.url,
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn((event: string, handler: any) => {
        if (event === 'message') {
          this.messageHandlers.push(handler)
        }
      }),
      removeEventListener: vi.fn(),
      readyState: 0
    }

    if (options.autoConnect) {
      setTimeout(() => {
        this.connect()
      }, options.mockConnectionDelay || 100)
    }
  }

  static setup(options: MockWebSocketOptions) {
    MockWebSocket.instance = new MockWebSocket(options)
    return MockWebSocket.instance
  }

  connect() {
    this.connectionState = 'OPEN'
    this.socket.readyState = 1
    this.socket.onopen?.()
  }

  disconnect() {
    this.connectionState = 'CLOSED'
    this.socket.readyState = 3
    this.socket.onclose?.()
  }

  mockServerMessage(data: any) {
    const event = { data: JSON.stringify(data) }
    this.messageHandlers.forEach(handler => handler(event))
  }

  simulateError() {
    this.socket.onerror?.({ error: new Error('Mock WebSocket Error') })
  }

  simulateNetworkLoss() {
    this.disconnect()
    return {
      restore: () => this.connect()
    }
  }
}

// Example usage in tests:
/*
describe('WebSocket Component Tests', () => {
  let mockWS: MockWebSocket

  beforeEach(() => {
    mockWS = MockWebSocket.setup({
      url: 'ws://localhost:3000/api/socket',
      autoConnect: true
    })
  })

  it('handles incoming messages', async () => {
    mockWS.mockServerMessage({
      type: 'update',
      data: { id: 1, content: 'test' }
    })
    // Assert component updates
  })

  it('handles network loss', async () => {
    const connection = mockWS.simulateNetworkLoss()
    // Assert disconnected state
    connection.restore()
    // Assert reconnected state
  })
})
*/