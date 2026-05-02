import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PiAcpAgent } from '../../src/acp/agent.js'
import { PiRpcProcess } from '../../src/pi-rpc/process.js'
import { FakeAgentSideConnection, asAgentConn } from '../helpers/fakes.js'

test('PiAcpAgent: prompt auto-restores a persisted session after in-memory miss', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'pi-acp-restore-'))
  const sessionFile = join(cwd, 'session.jsonl')
  const conn = new FakeAgentSideConnection()
  const agent = new PiAcpAgent(asAgentConn(conn))

  const restoredSession = {
    sessionId: 's1',
    proc: {},
    async prompt(message: string) {
      assert.equal(message, 'hello')
      return 'end_turn'
    },
    wasCancelRequested() {
      return false
    }
  }

  let spawnParams: any = null
  const originalSpawn = (PiRpcProcess as any).spawn
  ;(PiRpcProcess as any).spawn = async (params: any) => {
    spawnParams = params
    return { restoredProc: true }
  }

  try {
    ;(agent as any).sessions = {
      maybeGet() {
        return undefined
      },
      getOrCreate(sessionId: string, params: any) {
        assert.equal(sessionId, 's1')
        assert.equal(params.cwd, cwd)
        assert.deepEqual(params.mcpServers, [])
        assert.deepEqual(params.proc, { restoredProc: true })
        return restoredSession
      }
    }
    ;(agent as any).store = {
      get(sessionId: string) {
        assert.equal(sessionId, 's1')
        return { sessionId, cwd, sessionFile, updatedAt: new Date().toISOString() }
      }
    }

    const res = await agent.prompt({
      sessionId: 's1',
      prompt: [{ type: 'text', text: 'hello' }]
    } as any)

    assert.equal(res.stopReason, 'end_turn')
    assert.deepEqual(spawnParams, {
      cwd,
      sessionPath: sessionFile,
      piCommand: process.env.PI_ACP_PI_COMMAND
    })
  } finally {
    ;(PiRpcProcess as any).spawn = originalSpawn
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('PiAcpAgent: concurrent prompts share one auto-restore spawn', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'pi-acp-restore-'))
  const sessionFile = join(cwd, 'session.jsonl')
  const conn = new FakeAgentSideConnection()
  const agent = new PiAcpAgent(asAgentConn(conn))

  let spawnCount = 0
  let restored: any = null
  const restoredSession = {
    sessionId: 's1',
    proc: {},
    async prompt() {
      return 'end_turn'
    },
    wasCancelRequested() {
      return false
    }
  }

  const originalSpawn = (PiRpcProcess as any).spawn
  ;(PiRpcProcess as any).spawn = async () => {
    spawnCount += 1
    await new Promise(resolve => setTimeout(resolve, 10))
    return { restoredProc: true }
  }

  try {
    ;(agent as any).sessions = {
      maybeGet() {
        return restored
      },
      getOrCreate() {
        restored = restoredSession
        return restoredSession
      }
    }
    ;(agent as any).store = {
      get(sessionId: string) {
        return { sessionId, cwd, sessionFile, updatedAt: new Date().toISOString() }
      }
    }

    const [a, b] = await Promise.all([
      agent.prompt({ sessionId: 's1', prompt: [{ type: 'text', text: 'one' }] } as any),
      agent.prompt({ sessionId: 's1', prompt: [{ type: 'text', text: 'two' }] } as any)
    ])

    assert.equal(a.stopReason, 'end_turn')
    assert.equal(b.stopReason, 'end_turn')
    assert.equal(spawnCount, 1)
  } finally {
    ;(PiRpcProcess as any).spawn = originalSpawn
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('PiAcpAgent: prompt still reports Unknown sessionId when no persisted session exists', async () => {
  const conn = new FakeAgentSideConnection()
  const agent = new PiAcpAgent(asAgentConn(conn))

  ;(agent as any).sessions = {
    maybeGet() {
      return undefined
    }
  }
  ;(agent as any).store = {
    get() {
      return null
    }
  }

  await assert.rejects(
    () =>
      agent.prompt({
        sessionId: 'missing',
        prompt: [{ type: 'text', text: 'hello' }]
      } as any),
    /Invalid params/
  )
})
