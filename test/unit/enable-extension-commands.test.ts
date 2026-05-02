import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getEnableExtensionCommands } from '../../src/acp/pi-settings.js'

const oldEnv = process.env.PI_ACP_ENABLE_EXTENSION_COMMANDS

afterEach(() => {
  if (oldEnv === undefined) delete process.env.PI_ACP_ENABLE_EXTENSION_COMMANDS
  else process.env.PI_ACP_ENABLE_EXTENSION_COMMANDS = oldEnv
})

test('getEnableExtensionCommands: defaults to false', () => {
  delete process.env.PI_ACP_ENABLE_EXTENSION_COMMANDS
  const cwd = mkdtempSync(join(tmpdir(), 'pi-acp-ext-'))
  try {
    assert.equal(getEnableExtensionCommands(cwd), false)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('getEnableExtensionCommands: env var enables commands', () => {
  process.env.PI_ACP_ENABLE_EXTENSION_COMMANDS = 'true'
  const cwd = mkdtempSync(join(tmpdir(), 'pi-acp-ext-'))
  try {
    assert.equal(getEnableExtensionCommands(cwd), true)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('getEnableExtensionCommands: project setting enables commands', () => {
  delete process.env.PI_ACP_ENABLE_EXTENSION_COMMANDS
  const cwd = mkdtempSync(join(tmpdir(), 'pi-acp-ext-'))
  try {
    mkdirSync(join(cwd, '.pi'), { recursive: true })
    writeFileSync(join(cwd, '.pi', 'settings.json'), JSON.stringify({ enableExtensionCommands: true }))
    assert.equal(getEnableExtensionCommands(cwd), true)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
