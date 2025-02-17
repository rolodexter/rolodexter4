import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FeedWidget } from '@/components/FeedWidget'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useStore } from '@/store'
import WebSocketServer, { mockServerMessage, mockConnectionEvents } from '../../mocks/websocket.mock'

// Mock hooks
vi.mock('@/hooks/useWebSocket')
vi.mock('@/store')

describe('FeedWidget Component', () => {
  let mockWS: WebSocketServer

  beforeEach(() => {
    mockWS = new WebSocketServer('ws://localhost:3000/api/socket')
    ;(useWebSocket as any).mockReturnValue({
      socket: mockWS,
      connected: true,
      connecting: false,
      error: null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    useStore.setState({})
  })

  describe('Rendering', () => {
    it('renders feed items in correct order', async () => {
      const mockFeedItems = [
        { id: 1, author: 'rolodexterGPT', content: 'Test message 1', timestamp: '2025-02-18T01:00:00Z' },
        { id: 2, author: 'rolodexterVS', content: 'Test message 2', timestamp: '2025-02-18T01:05:00Z' }
      ]
      useStore.setState({ feedItems: mockFeedItems })

      render(<FeedWidget />)
      
      const feedItems = screen.getAllByRole('article')
      expect(feedItems).toHaveLength(2)
      expect(feedItems[0]).toHaveTextContent('Test message 2') // Most recent first
      expect(feedItems[1]).toHaveTextContent('Test message 1')
    })

    it('displays loading state while fetching initial data', () => {
      useStore.setState({ loading: true })
      render(<FeedWidget />)
      expect(screen.getByTestId('feed-loading')).toBeInTheDocument()
    })
  })

  describe('Filtering', () => {
    it('filters feed items by author', async () => {
      const mockFeedItems = [
        { id: 1, author: 'rolodexterGPT', content: 'GPT message' },
        { id: 2, author: 'rolodexterVS', content: 'VS message' }
      ]
      useStore.setState({ feedItems: mockFeedItems })

      render(<FeedWidget />)
      
      fireEvent.click(screen.getByRole('button', { name: /filter/i }))
      fireEvent.click(screen.getByRole('option', { name: /rolodextergpt/i }))

      expect(screen.getByText('GPT message')).toBeInTheDocument()
      expect(screen.queryByText('VS message')).not.toBeInTheDocument()
    })
  })

  describe('WebSocket Integration', () => {
    it('adds new messages to feed in real-time', async () => {
      render(<FeedWidget />)

      mockServerMessage(mockWS, {
        type: 'new_message',
        data: {
          id: 1,
          author: 'rolodexterGPT',
          content: 'Real-time message',
          timestamp: '2025-02-18T01:10:00Z'
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Real-time message')).toBeInTheDocument()
      })
    })

    it('handles connection loss gracefully', async () => {
      render(<FeedWidget />)
      
      mockConnectionEvents.close(mockWS)
      
      await waitFor(() => {
        expect(screen.getByTestId('connection-warning')).toBeInTheDocument()
        expect(screen.getByText(/reconnecting/i)).toBeInTheDocument()
      })

      mockConnectionEvents.open(mockWS)
      
      await waitFor(() => {
        expect(screen.queryByTestId('connection-warning')).not.toBeInTheDocument()
      })
    })
  })

  describe('Offline Support', () => {
    it('queues messages when offline', async () => {
      const mockQueue = vi.fn()
      ;(useWebSocket as any).mockReturnValue({
        socket: mockWS,
        connected: false,
        queueMessage: mockQueue
      })

      render(<FeedWidget />)
      
      fireEvent.click(screen.getByRole('button', { name: /new message/i }))
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Offline message' }
      })
      fireEvent.click(screen.getByRole('button', { name: /send/i }))

      expect(mockQueue).toHaveBeenCalledWith(expect.objectContaining({
        content: 'Offline message'
      }))
    })
  })
})