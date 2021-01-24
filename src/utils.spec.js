import {parseVariablesFromExp, parseMeasureGroups, unique } from './utils'

describe('unique', () => {
  it('it works', () => {
    expect(unique(['aaa', 'aaa', 'aaa', 'bbb'])).toEqual(['aaa', 'bbb'])
  })
})

describe('parseMeasureGroups', () => {
  it('typical case', () => {
    expect(parseVariablesFromExp('Aaa AND Bbb=1 AND Ccc>4 AND Ddd<777 AND (Eee>1 AND Eee<10) AND Fff>-777'))
      .toEqual(['Aaa', 'Bbb', 'Ccc', 'Ddd', 'Eee', 'Fff'])
  })

  it('empty case', () => {
    expect(parseVariablesFromExp('')).toEqual([])
  })

  it('invalid expression', () => {
    expect(parseVariablesFromExp('measure:909')).toEqual(['measure'])
  })

  it('extra parens', () => {
    expect(parseVariablesFromExp('((Aa=Bb) OR (Cc < Dd))')).toEqual(['Aa', 'Cc'])
  })

  it('no expression', () => {
    expect(parseVariablesFromExp('Aaa')).toEqual(['Aaa'])
  })
})

describe('parseMeasureGroups', () => {
  it('typical case', () => {
    expect(parseMeasureGroups('Performance, Primary\nGoal, Fiscal Responsibility: 10\nStage, Case Resolution: 13'))
      .toEqual([
        {type: 'Performance', group: 'Primary'},
        {type: 'Goal', group: 'Fiscal Responsibility', order: 10},
        {type: 'Stage', group: 'Case Resolution', order: 13},
      ])
  })

  it('optional order', () => {
    expect(parseMeasureGroups('Goal, Public Safety:'))
      .toEqual([
        {type: 'Goal', group: 'Public Safety'}
      ])
  })

  it('simple case', () => {
    expect(parseMeasureGroups('Contextual, Population: 1'))
      .toEqual([
        {type: 'Contextual', group: 'Population', order: 1}
      ])
  })

// Group Type, Group: [Order]
// Performance, Companion: 26
// Contextual, Population: 1
// Performance, Primary\nGoal, Fiscal Responsibility: 10\nStage, Case Resolution: 13
// Case Flow Detail, Cases Received from Law Enforcement: 9
// Case Flow, Cases Received from Law Enforcement: 17\nCase Flow, Charging Decision: 7
// Case Flow, Timeliness: 1\nCase Flow Detail, Timeliness: 1


})
