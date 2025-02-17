/**
 * WebSocket Mocking Configuration
 * Used by Jest/Vitest to mock WebSocket connections during tests
 */

import { vi } from 'vitest'

// Mock WebSocket class
class WebSocketServer {
  constructor(url: string) {
    this.url = url
  }

  url: string
  onopen: ((event: any) => void) | null = null
  onclose: ((event: any) => void) | null = null
  onmessage: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  readyState = 0
  CONNECTING = 0
  OPEN = 1
  CLOSING = 2
  CLOSED = 3

  send = vi.fn((data: string) => {
    console.log('WebSocket.send called with:', data)
  })

  close = vi.fn(() => {
    this.readyState = this.CLOSED
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure', wasClean: true })
    }
  })
}

// Setup global WebSocket mock
global.WebSocket = WebSocketServer as any

// Helper to simulate server messages
export const mockServerMessage = (ws: WebSocketServer, data: any) => {
  if (ws.onmessage) {
    ws.onmessage({ data: JSON.stringify(data) })
  }
}

// Helper to simulate connection events
export const mockConnectionEvents = {
  open: (ws: WebSocketServer) => {
    ws.readyState = ws.OPEN
    if (ws.onopen) ws.onopen({})
  },
  close: (ws: WebSocketServer) => {
    ws.readyState = ws.CLOSED
    if (ws.onclose) ws.onclose({ code: 1000, reason: 'Normal closure', wasClean: true })
  },
  error: (ws: WebSocketServer) => {
    if (ws.onerror) ws.onerror({ error: new Error('Mock WebSocket Error') })
  }
}

export default WebSocketServer