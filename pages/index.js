import React, { useState, Fragment } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.scss'
import classNames from 'classnames'
import path from 'path'
import csv from 'csvtojson'
import { parseVariablesFromExp, unique } from '../src/utils.js'

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
    <div className={styles.container}>
      <Head>
        <title>Commons Variable Impact Analyzer</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main>
        <h1>Commons Variable Impact Analyzer</h1>
        <p>Missing variables are highlighted in bold.</p>

        <div className={styles.buttonBar}>
          <button onClick={selectAll}>Select All</button>
          <button onClick={selectNone}>Select None</button>
          <button onClick={resetVars}>Reset</button>
        </div>

        <div className={styles.columns}>

          <div className={styles.variables}>
            <div className={styles.variableList}>
              {
                Object.keys(varAvail).map(k =>
                  <CheckBox key={k} id={k} checked={varAvail[k]} onChange={updateVarAvail} />
                )
              }
            </div>
          </div>
          <div className={styles.impact}>
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

  if(section.measure) {
    contents = (
    <div>
      <h2>{section.name}</h2>
      <MeasureBlock measures={measures} measureId={section.measure} varAvail={varAvail} />
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
                  <MeasureBlock key={measureId} className={styles.sectionCell} measures={measures} measureId={measureId} varAvail={varAvail}/>
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

const MeasureBlock = ({className, measures, measureId, varAvail}) => {
  let measure = measures.find(m => m.id === measureId)

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


export async function getStaticProps() {
  const dateStages = {
    'Referral': 'RfrrlDt',
    'Filing':  'FilingDt',
    'Disposition': 'DispoDt',
    'Deferred Prosecution or Pretrial Diversion': 'DfrrlOrdrDt',
    'Arraignment': 'DfrrlOrdrDt',
    'Arrest': 'ArrstDt',
    'Sentence': 'SntncDt'
  }

  const codebookData = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Codebook.csv'))
  const measureData = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Measures.csv'))
  const caseflowSectionData = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Caseflow Sections.csv'))
  const variableProgress  = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo Codebook Variable Progress - Variables.csv'))

  // Remove empty entries from the codebook data
  const codebook = codebookData.map(v => v.Variable).filter(v => v.length !== 0)

  // Collect the measures,
  const measures = measureData.map(m => {
    let measureVars = [
      ...parseVariablesFromExp(m['Variable - CTP']),
      ...parseVariablesFromExp(m['Expression 1 - CTP']),
      ...parseVariablesFromExp(m['Expression 2 - CTP']),
      ...parseVariablesFromExp(m['Unknown Expression 1 - CTP']),
      ...parseVariablesFromExp(m['Unknown Expression 2 - CTP']),
    ]

    if(dateStages[m['Date Stage - CTP']]) {
      measureVars.push(dateStages[m['Date Stage - CTP']])
    }

    measureVars = unique(measureVars).sort()

    // Make sure all the codebook variables exist in the codebook
    measureVars = measureVars.filter(mv => {
      if(!codebook.find(v => v === mv)) {
        // Warn when they don't
        console.error(`Measure: ${m['DB ID']} - ${m['Measure Title']} contains a calculation with unknown variable: ${mv}`)
        return false
      }
      return true
    })

    return {
      id: parseInt(m['DB ID']),
      name: m['Measure Title'],
      variables: measureVars
    }
  })

  // Remove all the variables that aren't referenced and turn variables into an array of objects
  const variables = codebook
    .filter(v =>
      measures.find(m => m.variables.find(mv => mv === v))
    )
    .sort()
    .map(v => ({name: v, priority: 4, status: 'Done'}))

  // Set each variables priority and status from variableProgress
  variables.forEach(v => {
    let p = variableProgress.find(p => p.Variable === v.name)
    if(p) {
      v.status = p['Status*']
      v.priority = p['Priority']
    }
  })

  const sections = []

  // Add the goals measure, this comes from directus, we'll just hardcode the id here
  sections.push({
    name: 'Prosecutor Goal',
    measure: 656
  })

  // Add the caseflow sections
  caseflowSectionData.forEach(s => {
    sections.push({
      name: 'Monthly Caseflow: ' + s['Name'].trim(),
      measure: parseInt(s['Measure'].trim())
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

  // Add Annual Measure Variables
  // Add explore view measures section (by measure group)
  // Add dependencies between variables

  // Add filters
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
      variables,
      measures,
      sections
    }
  }
}

