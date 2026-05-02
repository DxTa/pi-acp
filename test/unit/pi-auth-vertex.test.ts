import test, { afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { hasAnyPiAuthConfigured } from '../../src/pi-auth/status.js'

const savedEnv: Record<string, string | undefined> = {}
const keys = [
  'PI_CODING_AGENT_DIR',
  'OPENAI_API_KEY',
  'AZURE_OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'CEREBRAS_API_KEY',
  'XAI_API_KEY',
  'OPENROUTER_API_KEY',
  'AI_GATEWAY_API_KEY',
  'ZAI_API_KEY',
  'MISTRAL_API_KEY',
  'MINIMAX_API_KEY',
  'MINIMAX_CN_API_KEY',
  'MOONSHOT_API_KEY',
  'HF_TOKEN',
  'FIREWORKS_API_KEY',
  'OPENCODE_API_KEY',
  'KIMI_API_KEY',
  'CLOUDFLARE_API_KEY',
  'XIAOMI_API_KEY',
  'COPILOT_GITHUB_TOKEN',
  'GH_TOKEN',
  'GITHUB_TOKEN',
  'ANTHROPIC_OAUTH_TOKEN',
  'ANTHROPIC_API_KEY',
  'GOOGLE_CLOUD_API_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_CLOUD_PROJECT',
  'GCLOUD_PROJECT',
  'GOOGLE_CLOUD_LOCATION',
  'AWS_PROFILE',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BEARER_TOKEN_BEDROCK',
  'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
  'AWS_CONTAINER_CREDENTIALS_FULL_URI',
  'AWS_WEB_IDENTITY_TOKEN_FILE'
]

beforeEach(() => {
  for (const k of keys) {
    savedEnv[k] = process.env[k]
    delete process.env[k]
  }
  process.env.PI_CODING_AGENT_DIR = mkdtempSync(join(tmpdir(), 'pi-acp-auth-'))
})

afterEach(() => {
  const dir = process.env.PI_CODING_AGENT_DIR
  if (dir) rmSync(dir, { recursive: true, force: true })

  for (const k of keys) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
})

test('hasAnyPiAuthConfigured: accepts meaningful Vertex API key', () => {
  process.env.GOOGLE_CLOUD_API_KEY = 'real-key'
  assert.equal(hasAnyPiAuthConfigured(), true)
})

test('hasAnyPiAuthConfigured: ignores Vertex marker API key without ADC config', () => {
  process.env.GOOGLE_CLOUD_API_KEY = 'gcp-vertex-credentials'
  assert.equal(hasAnyPiAuthConfigured(), false)
})

test('hasAnyPiAuthConfigured: accepts Vertex ADC with project and location', () => {
  const credentials = join(process.env.PI_CODING_AGENT_DIR!, 'adc.json')
  writeFileSync(credentials, '{}')
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentials
  process.env.GOOGLE_CLOUD_PROJECT = 'my-project'
  process.env.GOOGLE_CLOUD_LOCATION = 'us-central1'
  assert.equal(hasAnyPiAuthConfigured(), true)
})
