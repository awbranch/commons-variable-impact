// import Clubhouse from 'clubhouse-lib'
let Clubhouse = require('clubhouse-lib')

const PRIORITY_MAP = {
  'priority 1 var': 1,
  'priority 2 var': 2,
  'priority 3 var': 3,
  'priority 4 var': 4,
}

const loadVariableProgress = async () => {
  const token = process.env.CLUBHOUSE_API_TOKEN
  if(!token) {
    console.log(`CLUBHOUSE_API_TOKEN env var not specified`)
    return
  }

  const projectName = process.env.CLUBHOUSE_PROJECT
  if(!projectName) {
    console.log(`CLUBHOUSE_PROJECT env var not specified`)
    return
  }

  const epicNames = process.env.CLUBHOUSE_EPICS
  if(!epicNames) {
    console.log(`CLUBHOUSE_EPICS env var not specified`)
    return
  }

  const client = Clubhouse.create(token)
  const projects = await client.listProjects()
  const targetProject = projects.find(p => p.name === projectName)

  if(!targetProject) {
    console.log(`Project "${projectName}" not found`)
    return
  }

  const epics = await client.listEpics()
  const targetEpics = []

  for(let name of epicNames.split(',')) {
    let epic = epics.find(e => e.name === name)
    if(!epic) {
      console.log(`Epic "${name}" not found`)
      return
    }
    targetEpics.push(epic)
  }

  // Find the workflow for our target project
  let workflows = await client.listWorkflows()
  let workflow = await workflows.find(w => w.project_ids.find(id => id === targetProject.id))

  // Get the stories for the project
  let storyIds = (await client.listStories(targetProject.id)).map(s => s.id)

  let variables = []
  let count = 0;
  for(let id of storyIds) {
    // console.log(`Get Story ID: ${id}`)
    let story = await client.getStory(id)

    let name = story.name
    let status = workflow.states.find(w => w.id === story.workflow_state_id).name
    let label = story.labels.find(l => PRIORITY_MAP[l.name])
    let priority = label ? PRIORITY_MAP[label.name] : 5
    let missingness = parseMissing(story.description)
    let dependsOn = parseDependsOn(story.description) || ''

    variables.push({name, status, priority, missingness, dependsOn})
  }

  return variables
}

const parseMissing = (description) => {
  if(!description) return null
  let m = description.match(/Missingness:[*\s]*([\d.]*%)/m)
  return m ? m[1] : null
}

const parseDependsOn = (description) => {
  if(!description) return null
  let m = description.match(/Depends On:[*\s]*(.*)/m)
  return m ? m[1].trim() : null
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.loadVariableProgress = loadVariableProgress;
