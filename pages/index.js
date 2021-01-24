import React, { useState, Fragment } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.scss'
import classNames from 'classnames'
import path from 'path'
import csv from 'csvtojson'
import { unique, parseVariablesFromExp, parseMeasureGroups} from '../src/utils.js'

// List of filters and the variables they depend on
const FILTERS = []

export default function Home({ variables, measures, sections }) {

  const [varAvail, setVarAvail] = useState(variables.reduce((a, v) => {
    a[v.name] = (v.status === 'Done' || v.status === 'Fixup')
    return a
  }, {}))

  const updateVarAvail = (e) => {
    setVarAvail({
      ...varAvail,
      [e.target.id]: e.target.checked
    })
  }

  const selectAll = (e) => {
    setVarAvail(variables.reduce((a, v) => {
      a[v.name] = true
      return a
    }, {}))
  }

  const selectNone = (e) => {
    setVarAvail(variables.reduce((a, v) => {
      a[v.name] = false
      return a
    }, {}))
  }

  const resetVars = (e) => {
    setVarAvail(variables.reduce((a, v) => {
      a[v.name] = (v.status === 'Done' || v.status === 'Fixup')
      return a
    }, {}))
  }

  return (
    <div>
      <Head>
        <title>Commons Variable Impact Analyzer</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main>
        <div className={styles.columns}>

          <div className={styles.variables}>

            <div className={styles.buttonBar}>
              <button onClick={selectAll}>All</button>
              <button onClick={selectNone}>None</button>
              <button onClick={resetVars}>Reset</button>
            </div>


            <div className={styles.variableList}>
              {
                Object.keys(varAvail).map(k =>
                  <CheckBox key={k} id={k} checked={varAvail[k]} onChange={updateVarAvail} />
                )
              }
            </div>
          </div>
          <div className={styles.impact}>
            <h1>Commons Variable Impact Analyzer</h1>
            <div><i>Missing sections highlighted in red and missing variables are bold.</i></div>
            {
              sections.map((s,i) =>
                <MeasureSection key={i} section={s} varAvail={varAvail} measures={measures}/>
              )
            }
          </div>
        </div>
      </main>
    </div>
  )
}

const CheckBox = ({id, checked, onChange}) => {
  return (
    <div className={styles.variable}>
      <input
        type='checkbox' id={id}
        onChange={(e) => onChange(e)}
        checked={checked}
      />
      <label htmlFor={id}>{id}</label>
    </div>
  )
}

const MeasureSection = ({section, varAvail, measures}) => {
  let contents

  if(section.measures) {
    contents = (
    <div>
      <h2>{section.name}</h2>
      {
        section.measures.map(measureId => (
          <MeasureBlock
            key={measureId}
            measure={measures.find(m => m.id === measureId)}
            varAvail={varAvail}
          />
        ))
      }
    </div>
    )
  } else {
    contents = (
      <div className={styles.sectionTable}>
        {
          section.columns.map((c, i) => (
            <div key={i} className={styles.sectionColumn}>
              {
                c.measures.map(measureId => (
                  <MeasureBlock
                    key={measureId}
                    className={styles.sectionCell}
                    measure={measures.find(m => m.id === measureId)}
                    varAvail={varAvail}
                  />
                ))
              }
            </div>
          ))
        }
      </div>
    )
  }

  return <div className={styles.section}>{contents}</div>
}

const MeasureBlock = ({className, measure, varAvail}) => {
  // If one variable isn't availalbe, the measure isn't available
  const measureAvailable = !measure.variables.find(v => !varAvail[v])

  return (
    <div
      className={classNames(
        className,
        styles.dataBlock,
        measureAvailable ? styles.available: styles.unavailable
      )}>
      <div className={styles.measureTitle}>
        {measure.id}: {measure.name}
      </div>
      <div className={styles.measureVariableList}>
        {
          measure.variables.map((v, i) => (
            <span key={i} className={classNames({[styles.measureVariableUnavailable]: !varAvail[v]})}>
              {`${i > 0 ? ', ': ''}${v}`}
            </span>
          ))
        }
      </div>
    </div>
  )
}

const DATE_STAGE = {
  'Referral':    'RfrrlDt',
  'Filing':      'FilingDt',
  'Disposition': 'DispoDt',
  'Deferred Prosecution or Pretrial Diversion': 'DfrrlOrdrDt',
  'Arraignment': 'DfrrlOrdrDt',
  'Arrest':      'ArrstDt',
  'Sentence':    'SntncDt'
}

export async function getStaticProps() {

  const codebook = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Codebook.csv'))
  const variableProgress  = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo Codebook Variable Progress - Variables.csv'))

  const measureData = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Measures.csv'))
  const caseflowSectionData = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Caseflow Sections.csv'))

  // Create a master map of variables
  const variables = codebook.reduce((a, v) => {
    let name = v['Variable']
    if(name.length > 0) {
      a[name] = {
        name: name,
        status: '',
        priority: '',
        dependsOn: []
      }
    }
    return a
  }, {})

  // Add the progress to each variable
  variableProgress.forEach(p => {
    let name = p['Variable']
    let v = variables[name]
    if(!v) {
      console.error(`Progress Variable: ${name} not found in codebook`)
    } else {
      v.status = p['Status*']
      v.priority = p['Priority']

      let dependsOn  = [...(p['Depends On Variable'].split(',').map(v => v.trim()))]
      dependsOn.forEach(d => {
        if(d.length > 0) {
          if(!variables[d]) {
            console.error(`Progress Variable: ${name} depends on variable ${d} not found in codebook`)
          } else {
            v.dependsOn.push(d)
          }

        }
      })
    }
  })

  const measures = measureData.map(m => {

    let measureId = parseInt(m['DB ID'])
    let measureName = m['Measure Title']
    let measureGroups = parseMeasureGroups(m['Groups'])
    let relatedMeasures = m['Related Measures - CTP'].trim().split(',').map(s => parseInt(s))

    // Parse all the variables form the various measure expressions
    let measureVars = [
      ...parseVariablesFromExp(m['Variable - CTP']),
      ...parseVariablesFromExp(m['Expression 1 - CTP']),
      ...parseVariablesFromExp(m['Expression 2 - CTP']),
      ...parseVariablesFromExp(m['Unknown Expression 1 - CTP']),
      ...parseVariablesFromExp(m['Unknown Expression 2 - CTP']),
      // TODO: are there other variables the measure depends on in the master sheet?
    ]

    // Get any variables based on the date stage
    if(DATE_STAGE[m['Date Stage - CTP']]) {
      measureVars.push(DATE_STAGE[m['Date Stage - CTP']])
    }

    // Remove duplicates
    measureVars = unique(measureVars)

    // Make sure all the measureVariables are valid
    measureVars = measureVars.filter(v => {
      if(!variables[v]) {
        console.error(`Measure: ${measureId}: ${measureName} contains a calculation with unknown variable: ${v}`)
        return false
      }
      return true
    })

    // A measure may have a variable that depends on another variable, if so, add that other variable to the measures vars
    let dependantVars = []
    measureVars.forEach(mv => {
      dependantVars.push(...variables[mv].dependsOn)
    })

    // Add all the dependancies to the measure vars
    if(dependantVars.length > 0) {
      measureVars.push(...dependantVars)
    }

    // Remove duplicates again and sort
    measureVars = unique(measureVars).sort()

    return {
      id: measureId,
      name: measureName,
      variables: measureVars,
      measureGroups: measureGroups,
      relatedMeasures: relatedMeasures
    }
  })

  // Remove all variables that aren't referenced in by the measures
  const variableList = Object.values(variables)
    .filter(v => {
    // // If it has any status or is referenced by the measures, keep it
    return v.priority.length > 0 || (measures.find(m => m.variables.find(mv => mv === v.name)))
  }).sort((a, b) => a.name.localeCompare(b.name))

 const sections = []

  // Add the goals measure, this comes from directus, we'll just hardcode the id here
  sections.push({
    name: 'Prosecutor Goal',
    measures: [656]
  })

  // Add the caseflow sections
  caseflowSectionData.forEach(s => {
    sections.push({
      name: 'Monthly Caseflow: ' + s['Name'].trim(),
      measures: [parseInt(s['Measure'].trim())]
    })

    sections.push({
      columns: [{
        name: 'Data Viz',
        measures: s['Pie Chart Breakdown'].split(',').map(v => parseInt(v.trim()))
      }, {
        name: 'Misdemeanor',
        measures: [
          parseInt(s['Misdemeanor']),
          ...s['Misdemeanor Breakdown'].split(',').map(v => parseInt(v.trim()))
        ]
      }, {
        name: 'Felony',
        measures: [
          parseInt(s['Felony']),
          ...s['Felony Breakdown'].split(',').map(v => parseInt(v.trim()))
        ]
      }]
    })
  })

  // Add the annual measures
  let annualMeasures = measures
    .filter(m => m.measureGroups.find(g => g.type === 'Performance' && g.group === 'Primary'))
    .sort((a, b) => (a.id - b.id))

  sections.push({
    name: 'Annual Measures',
    measures: annualMeasures.map(m => m.id)
  })

  sections.push({
    name: 'Other Annual Measure Companions',
    measures: measures
      .filter(m =>
        m.measureGroups.find(g => g.type === 'Performance' && g.group === 'Companion') &&
        annualMeasures.find(a => a.relatedMeasures.find(r => r === m.id))
      )
      .sort((a, b) => (a.id - b.id))
      .map(m => m.id)
  })

  // Handle @ variables like  @TotDrgHybridCrts in - 118	Performance, Companion: 18	Drug Courts

  // Add filters
  // Add explore view measures section (by measure group)

  // Add more columns to the checkboxes: Status, Missing, Priority
  // Allow sorting of each column

  // Initialize checkboxes with those already done variables as a starting place
  // Within each group
  //    Add the measure id: name
  //    Add list all variables mark missing bold or with background dark?
  // Publish it to gihub pages
  // Get it to read the googlesheet directly alternatily local excel sheet

  // Checkboxes add
  //    Sort/Group: Alpha, Priority (from Variable Progress)

  return {
    props: {
      variables: variableList,
      measures,
      sections
    }
  }
}

