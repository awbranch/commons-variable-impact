export const parseVariablesFromExp = (exp) => {
  exp = exp.trim()
  if(exp.length === 0) {
    return []
  }

  let terms = exp.split(/AND|OR/)
  let vars = terms.map(t => {
    const found = t.match(/([\d\w]+)\s*(<|>|=)*/)
    return found ? found[1] : t
  })

  return unique(vars)
}

export const unique = (arr) => {
  return [...(new Set(arr))]
}

export const parseMeasureGroups = (text) => {

  const groups = []
  const parts = text.trim().split('\n')
  parts.forEach(p => {
    const found = p.match(/([\w\s]+)[,:]\s*([\w\s\-]+)\s*:?\s*(\d*)/)
    if(!found) {
      console.log(`Unable to parse measure group: ${text}`)
    } else {

      let group = {
        type: found[1],
        group: found[2]
      }

      if(found[3] !== undefined && found[3].length > 0) {
        group.order = parseInt(found[3])
      }
      groups.push(group)
    }
  })

  return groups
}

