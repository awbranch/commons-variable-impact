// import { loadVariableProgress, parseMissing, parseDependsOn } from './clubhouseConnector'
//
// describe('loadVariableProgress', () => {
//   it('it works', async () => {
//     jest.setTimeout(30000);
//     let variables = await loadVariableProgress()
//     console.log(JSON.stringify(variables, null, 3))
//
//     // expect(unique(['aaa', 'aaa', 'aaa', 'bbb'])).toEqual(['aaa', 'bbb'])
//   })
// })
//
// describe('parseMissing', () => {
//   it('it works', () => {
//     expect(parseMissing('Blah\n\n**Depends On:** Blah\n\n**Missingness:** 1.23%')).toEqual('1.23%')
//     expect(parseMissing('Blah\n\n**Depends On:** Blah\n\nMissingness: 1.23%\n')).toEqual('1.23%')
//     expect(parseMissing('Blah\n\n**Depends On:** Blah')).toEqual(null)
//     expect(parseMissing(null)).toEqual(null)
//   })
// })
//
// describe('parseDependsOn', () => {
//   it('it works', () => {
//     expect(parseDependsOn('Days from arraignment to case closure\n\n**Depends On:** IntApprncDt,DispoDt\n\nMissingness: 16.00%'))
//       .toEqual('IntApprncDt,DispoDt')
//     expect(parseDependsOn('Days from arraignment to case closure\n\nDepends On: IntApprncDt,DispoDt\n\nMissingness: 16.00%'))
//       .toEqual('IntApprncDt,DispoDt')
//     expect(parseDependsOn('Blah\n\n**Depends On:**')).toEqual('')
//     expect(parseDependsOn('Blah\n\n** Blah')).toEqual(null)
//     expect(parseDependsOn(null)).toEqual(null)
//   })
// })
//
//
