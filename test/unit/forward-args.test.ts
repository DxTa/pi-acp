import test from 'node:test'
import assert from 'node:assert/strict'
import { getForwardedPiArgs } from '../../src/pi-rpc/forward-args.js'

test('getForwardedPiArgs: forwards unknown pi flags', () => {
  assert.deepEqual(getForwardedPiArgs(['--model', 'openai/gpt-5', '--foo=bar']), ['--model', 'openai/gpt-5', '--foo=bar'])
})

test('getForwardedPiArgs: strips pi-acp-managed flags', () => {
  assert.deepEqual(getForwardedPiArgs(['--mode', 'rpc', '--session', 's.jsonl', '--no-themes', '--terminal-login']), [])
})

test('getForwardedPiArgs: strips managed equals forms', () => {
  assert.deepEqual(getForwardedPiArgs(['--mode=rpc', '--session=s.jsonl', '--model', 'x']), ['--model', 'x'])
})

test('getForwardedPiArgs: forwards everything after separator', () => {
  assert.deepEqual(getForwardedPiArgs(['--terminal-login', '--', '--mode', 'rpc']), ['--mode', 'rpc'])
})
