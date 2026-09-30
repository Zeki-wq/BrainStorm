export function normalize2D(cells) {
  const minX = Math.min(...cells.map(([x]) => x))
  const minY = Math.min(...cells.map(([, y]) => y))
  return cells.map(([x, y]) => [x - minX, y - minY]).sort(([ax, ay], [bx, by]) => ay - by || ax - bx)
}

export function rotate2D(cells, turns = 1) {
  let result = cells
  for (let turn = 0; turn < turns; turn += 1) result = result.map(([x, y]) => [y, -x])
  return normalize2D(result)
}

export function mirror2D(cells) {
  return normalize2D(cells.map(([x, y]) => [-x, y]))
}

export function equivalent2D(first, second) {
  const target = JSON.stringify(normalize2D(second))
  let rotated = normalize2D(first)
  for (let turn = 0; turn < 4; turn += 1) {
    if (JSON.stringify(rotated) === target) return true
    rotated = rotate2D(rotated)
  }
  return false
}

export function normalize3D(cells) {
  const mins = [0, 1, 2].map(axis => Math.min(...cells.map(cell => cell[axis])))
  return cells.map(cell => cell.map((value, axis) => value - mins[axis])).sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0])
}

export function rotate3D(cells, axis) {
  const rotated = cells.map(([x, y, z]) => axis === 'x' ? [x, -z, y] : axis === 'y' ? [z, y, -x] : [-y, x, z])
  return normalize3D(rotated)
}

export function mirror3D(cells) {
  return normalize3D(cells.map(([x, y, z]) => [-x, y, z]))
}

export function equivalent3D(first, second) {
  const target = JSON.stringify(normalize3D(second))
  const queue = [normalize3D(first)]
  const seen = new Set()
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const shape = queue[cursor]
    const key = JSON.stringify(shape)
    if (key === target) return true
    if (seen.has(key)) continue
    seen.add(key)
    queue.push(rotate3D(shape, 'x'), rotate3D(shape, 'y'), rotate3D(shape, 'z'))
  }
  return false
}

export function shuffle(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}
