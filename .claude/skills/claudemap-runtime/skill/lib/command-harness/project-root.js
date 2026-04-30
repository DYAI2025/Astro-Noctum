import path from 'path'

export function resolveProjectRoot(argv, positionalName = null, parsedArgs = null) {
  let projectRootArg = null

  if (positionalName && parsedArgs) {
    const positionalKey = toCamel(positionalName)
    const positionalValue = parsedArgs[positionalKey]

    if (typeof positionalValue === 'string' && positionalValue.trim()) {
      projectRootArg = positionalValue.trim()
    }
  }

  return path.resolve(
    projectRootArg ||
    process.env.CLAUDEMAP_PROJECT_ROOT ||
    process.env.INIT_CWD ||
    process.cwd(),
  )
}

function toCamel(value) {
  return String(value).replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())
}
