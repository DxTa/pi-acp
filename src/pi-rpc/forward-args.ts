const MANAGED_FLAGS_WITH_VALUE = new Set(['--mode', '--session'])
const MANAGED_FLAGS_WITHOUT_VALUE = new Set(['--no-themes', '--terminal-login'])

export function getForwardedPiArgs(argv: string[] = process.argv.slice(2)): string[] {
  const out: string[] = []

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--') {
      out.push(...argv.slice(i + 1))
      break
    }

    const eq = arg.indexOf('=')
    const flagName = eq === -1 ? arg : arg.slice(0, eq)

    if (MANAGED_FLAGS_WITHOUT_VALUE.has(flagName)) continue

    if (MANAGED_FLAGS_WITH_VALUE.has(flagName)) {
      if (eq === -1) i += 1
      continue
    }

    out.push(arg)
  }

  return out
}
