let {loadVariableProgress} = require('./clubhouseConnector')
const fs = require('fs-extra');

main(process.argv)
  .then(res => {
    process.exitCode = res
  })
  .catch(err => {
    process.exitCode = 1
    throw err
  })

async function main(args) {
  let vars = await loadVariableProgress()
  await fs.writeJson('../data/Yolo Variable Progress.json', vars, {spaces: 3});
}
