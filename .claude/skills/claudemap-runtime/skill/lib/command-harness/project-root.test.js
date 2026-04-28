import { describe, expect, it } from 'vitest'
import { resolveProjectRoot } from './project-root.js'

describe('resolveProjectRoot', () => {
  it('uses the parsed projectRoot positional when explicitly provided', () => {
    const resolved = resolveProjectRoot(['create-map', '/tmp/demo'], 'projectRoot', {
      projectRoot: '/tmp/demo',
    })

    expect(resolved).toBe('/tmp/demo')
  })

  it('ignores dispatcher action tokens and falls back when projectRoot positional is absent', () => {
    const expectedFallback = process.cwd()
    const resolved = resolveProjectRoot(['show', 'highlight', 'auth'], null, {
      query: 'auth',
    })

    expect(resolved).toBe(expectedFallback)
  })
})
