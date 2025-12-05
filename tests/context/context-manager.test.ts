#!/usr/bin/env bun

/**
 * Tests for the context management module
 * Tests memory, retrieval, and session functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { ContextManager } from '../../src/context'
import { MemoryStore } from '../../src/context/memory'
import { VectorStore } from '../../src/context/vector'
import { SessionManager } from '../../src/context/session'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmSync } from 'fs'

describe('Context Management', () => {
  let contextManager: ContextManager
  let memoryStore: MemoryStore
  let vectorStore: VectorStore
  let sessionManager: SessionManager
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `ferg-context-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    
    memoryStore = new MemoryStore()
    vectorStore = new VectorStore({ dimension: 1536, indexType: 'flat' })
    sessionManager = new SessionManager({ storagePath: tempDir })
    contextManager = new ContextManager({
      memoryStore,
      vectorStore,
      sessionManager
    })
  })

  afterEach(() => {
    // Cleanup temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('MemoryStore', () => {
    it('should store and retrieve memories', async () => {
      const memory = {
        id: 'test-memory-1',
        content: 'Test memory content',
        metadata: { type: 'test', importance: 0.8 },
        timestamp: new Date(),
        tags: ['test', 'memory']
      }

      await memoryStore.store(memory)
      const retrieved = await memoryStore.retrieve('test-memory-1')

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(memory.id)
      expect(retrieved?.content).toBe(memory.content)
      expect(retrieved?.metadata).toEqual(memory.metadata)
    })

    it('should handle non-existent memory retrieval', async () => {
      const retrieved = await memoryStore.retrieve('non-existent')
      expect(retrieved).toBeNull()
    })

    it('should search memories by content', async () => {
      const memories = [
        {
          id: 'mem1',
          content: 'JavaScript programming concepts',
          metadata: { type: 'code' },
          timestamp: new Date(),
          tags: ['javascript']
        },
        {
          id: 'mem2',
          content: 'Python programming basics',
          metadata: { type: 'code' },
          timestamp: new Date(),
          tags: ['python']
        },
        {
          id: 'mem3',
          content: 'JavaScript async patterns',
          metadata: { type: 'code' },
          timestamp: new Date(),
          tags: ['javascript', 'async']
        }
      ]

      for (const memory of memories) {
        await memoryStore.store(memory)
      }

      const results = await memoryStore.search('JavaScript')
      expect(results).toHaveLength(2)
      expect(results.map(r => r.id)).toContain('mem1')
      expect(results.map(r => r.id)).toContain('mem3')
    })

    it('should filter memories by tags', async () => {
      const memories = [
        {
          id: 'mem1',
          content: 'Frontend development',
          metadata: { type: 'frontend' },
          timestamp: new Date(),
          tags: ['frontend', 'react']
        },
        {
          id: 'mem2',
          content: 'Backend development',
          metadata: { type: 'backend' },
          timestamp: new Date(),
          tags: ['backend', 'nodejs']
        }
      ]

      for (const memory of memories) {
        await memoryStore.store(memory)
      }

      const results = await memoryStore.findByTags(['frontend'])
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('mem1')
    })

    it('should delete memories', async () => {
      const memory = {
        id: 'mem-to-delete',
        content: 'This will be deleted',
        metadata: { type: 'test' },
        timestamp: new Date(),
        tags: []
      }

      await memoryStore.store(memory)
      expect(await memoryStore.retrieve('mem-to-delete')).toBeDefined()

      await memoryStore.delete('mem-to-delete')
      expect(await memoryStore.retrieve('mem-to-delete')).toBeNull()
    })

    it('should handle memory expiration', async () => {
      const oldMemory = {
        id: 'old-memory',
        content: 'Old memory',
        metadata: { type: 'test' },
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        tags: []
      }

      const recentMemory = {
        id: 'recent-memory',
        content: 'Recent memory',
        metadata: { type: 'test' },
        timestamp: new Date(),
        tags: []
      }

      await memoryStore.store(oldMemory)
      await memoryStore.store(recentMemory)

      // Clean up memories older than 24 hours
      await memoryStore.cleanup(24 * 60 * 60 * 1000)

      expect(await memoryStore.retrieve('old-memory')).toBeNull()
      expect(await memoryStore.retrieve('recent-memory')).toBeDefined()
    })
  })

  describe('VectorStore', () => {
    it('should store and retrieve vectors', async () => {
      const vector = Array(1536).fill(0).map((_, i) => i / 1536)
      const metadata = {
        id: 'vec1',
        content: 'Test vector content',
        type: 'test'
      }

      await vectorStore.store(vector, metadata)
      const results = await vectorStore.similaritySearch(vector, 5)

      expect(results).toHaveLength(1)
      expect(results[0].metadata.id).toBe('vec1')
      expect(results[0].score).toBeCloseTo(1.0, 2)
    })

    it('should perform similarity search correctly', async () => {
      const vectors = [
        {
          data: Array(1536).fill(0).map((_, i) => i / 1536),
          metadata: { id: 'vec1', content: 'Similar content A' }
        },
        {
          data: Array(1536).fill(0).map((_, i) => (i + 100) / 1536),
          metadata: { id: 'vec2', content: 'Similar content B' }
        },
        {
          data: Array(1536).fill(0).map((_, i) => (i + 500) / 1536),
          metadata: { id: 'vec3', content: 'Different content' }
        }
      ]

      for (const vector of vectors) {
        await vectorStore.store(vector.data, vector.metadata)
      }

      const queryVector = Array(1536).fill(0).map((_, i) => i / 1536)
      const results = await vectorStore.similaritySearch(queryVector, 3)

      expect(results).toHaveLength(3)
      expect(results[0].metadata.id).toBe('vec1') // Most similar
      expect(results[1].metadata.id).toBe('vec2') // Second most similar
      expect(results[2].metadata.id).toBe('vec3') // Least similar
    })

    it('should handle empty vector store', async () => {
      const vector = Array(1536).fill(0).map((_, i) => i / 1536)
      const results = await vectorStore.similaritySearch(vector, 5)

      expect(results).toHaveLength(0)
    })

    it('should delete vectors', async () => {
      const vector = Array(1536).fill(0).map((_, i) => i / 1536)
      const metadata = { id: 'vec-to-delete', content: 'Delete me' }

      await vectorStore.store(vector, metadata)
      
      let results = await vectorStore.similaritySearch(vector, 5)
      expect(results).toHaveLength(1)

      await vectorStore.delete('vec-to-delete')
      
      results = await vectorStore.similaritySearch(vector, 5)
      expect(results).toHaveLength(0)
    })
  })

  describe('SessionManager', () => {
    it('should create and manage sessions', async () => {
      const sessionId = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { purpose: 'testing' }
      })

      expect(sessionId).toBeDefined()
      expect(typeof sessionId).toBe('string')

      const session = await sessionManager.getSession(sessionId)
      expect(session).toBeDefined()
      expect(session?.userId).toBe('test-user')
      expect(session?.metadata.purpose).toBe('testing')
    })

    it('should update session activity', async () => {
      const sessionId = await sessionManager.createSession({ userId: 'test-user' })
      const originalSession = await sessionManager.getSession(sessionId)
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      await sessionManager.updateActivity(sessionId)
      const updatedSession = await sessionManager.getSession(sessionId)

      expect(updatedSession?.lastActivity.getTime()).toBeGreaterThan(
        originalSession?.lastActivity.getTime() || 0
      )
    })

    it('should store and retrieve session context', async () => {
      const sessionId = await sessionManager.createSession({ userId: 'test-user' })
      
      const context = {
        currentTask: 'code-review',
        files: ['file1.ts', 'file2.ts'],
        metadata: { priority: 'high' }
      }

      await sessionManager.setContext(sessionId, context)
      const retrievedContext = await sessionManager.getContext(sessionId)

      expect(retrievedContext).toEqual(context)
    })

    it('should handle session expiration', async () => {
      const sessionId = await sessionManager.createSession({ userId: 'test-user' })
      
      // Manually set old timestamp for testing
      const session = await sessionManager.getSession(sessionId)
      if (session) {
        session.lastActivity = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
        await sessionManager.saveSession(session)
      }

      await sessionManager.cleanupExpiredSessions(24 * 60 * 60 * 1000) // 24 hours
      
      const expiredSession = await sessionManager.getSession(sessionId)
      expect(expiredSession).toBeNull()
    })

    it('should list user sessions', async () => {
      const userId = 'test-user'
      
      const session1Id = await sessionManager.createSession({ userId })
      const session2Id = await sessionManager.createSession({ userId })
      await sessionManager.createSession({ userId: 'other-user' })

      const userSessions = await sessionManager.getUserSessions(userId)

      expect(userSessions).toHaveLength(2)
      const sessionIds = userSessions.map(s => s.id)
      expect(sessionIds).toContain(session1Id)
      expect(sessionIds).toContain(session2Id)
    })
  })

  describe('ContextManager Integration', () => {
    it('should integrate all context components', async () => {
      const sessionId = await sessionManager.createSession({ userId: 'integration-user' })
      
      // Store memory
      const memory = {
        id: 'integration-memory',
        content: 'Integration test memory',
        metadata: { type: 'integration' },
        timestamp: new Date(),
        tags: ['integration', 'test']
      }
      await memoryStore.store(memory)

      // Store vector
      const vector = Array(1536).fill(0).map((_, i) => i / 1536)
      await vectorStore.store(vector, { 
        id: 'integration-vector',
        content: 'Integration test vector'
      })

      // Set session context
      const context = {
        currentMemory: 'integration-memory',
        currentVector: 'integration-vector'
      }
      await sessionManager.setContext(sessionId, context)

      // Retrieve integrated context
      const sessionData = await sessionManager.getSession(sessionId)
      const memoryData = await memoryStore.retrieve('integration-memory')
      const vectorResults = await vectorStore.similaritySearch(vector, 1)

      expect(sessionData?.context).toEqual(context)
      expect(memoryData?.content).toBe('Integration test memory')
      expect(vectorResults).toHaveLength(1)
      expect(vectorResults[0].metadata.id).toBe('integration-vector')
    })

    it('should handle context search across all stores', async () => {
      const sessionId = await sessionManager.createSession({ userId: 'search-user' })

      // Add data to all stores
      await memoryStore.store({
        id: 'search-memory',
        content: 'JavaScript programming patterns',
        metadata: { type: 'code' },
        timestamp: new Date(),
        tags: ['javascript', 'patterns']
      })

      const jsVector = Array(1536).fill(0).map((_, i) => Math.sin(i))
      await vectorStore.store(jsVector, {
        id: 'search-vector',
        content: 'JavaScript async programming'
      })

      // Perform integrated search
      const memoryResults = await memoryStore.search('JavaScript')
      const vectorResults = await vectorStore.similaritySearch(jsVector, 5)

      expect(memoryResults).toHaveLength(1)
      expect(memoryResults[0].id).toBe('search-memory')
      expect(vectorResults).toHaveLength(1)
      expect(vectorResults[0].metadata.id).toBe('search-vector')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid session IDs gracefully', async () => {
      const session = await sessionManager.getSession('invalid-session-id')
      expect(session).toBeNull()
    })

    it('should handle vector dimension mismatches', async () => {
      const wrongVector = Array(100).fill(0) // Wrong dimension
      const metadata = { id: 'wrong-dim', content: 'Wrong dimension' }

      // Should handle gracefully or throw appropriate error
      expect(async () => {
        await vectorStore.store(wrongVector, metadata)
      }).toThrow()
    })

    it('should handle corrupted session data', async () => {
      const sessionId = await sessionManager.createSession({ userId: 'test-user' })
      
      // Write invalid JSON to session file
      const sessionFile = join(tempDir, `${sessionId}.json`)
      writeFileSync(sessionFile, 'invalid json content')

      const session = await sessionManager.getSession(sessionId)
      expect(session).toBeNull() // Should handle corrupted data gracefully
    })
  })
})