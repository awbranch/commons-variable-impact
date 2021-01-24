//
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

//
export const unique = (arr) => {
  return [...(new Set(arr))]
}

// console.log(parseVariablesFromExp('Prosecuted AND CaseStatus=1 AND TopFilingChrgOffns>4 AND TopFilingChrgOffns<777 AND TopFilingChrgFelMisd=1 AND FelDispo180=1 AND Prosecuted=1 AND CaseStatus=1 AND Cnvctd=1 AND (TopSntnc>1 AND TopSntnc<10) AND ReArrstFlag>-777'))
// console.log(parseVariablesFromExp('measure:909'))
// console.log(parseVariablesFromExp(''))
// console.log(parseVariablesFromExp('CaseDisposition > 0 AND TopFilingChrgFelMisd=1'))
// console.log(parseVariablesFromExp('((AA=BB) OR (CC < DD))'))
// console.log(parseVariablesFromExp('TopRfrrdChrgFelMisd'))
