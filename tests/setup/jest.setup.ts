/**
 * Jest/Vitest Setup Configuration
 * This file is referenced in our test configuration to set up the test environment
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock WebSocket
import WebSocketServer from '../mocks/websocket.mock'
global.WebSocket = WebSocketServer

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
global.localStorage = localStorageMock

// Mock IndexedDB for offline storage testing
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
}
global.indexedDB = indexedDB as any

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})