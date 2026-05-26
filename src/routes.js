// Route registration helper
export function route(method, path, handler) {
  const names = []
  const pattern = path.replace(/:([^/]+)/g, (_, name) => {
    names.push(name)
    return '([^/]+)'
  })
  return {
    method,
    pattern: new RegExp(`^${pattern}$`),
    names,
    handler,
  }
}
