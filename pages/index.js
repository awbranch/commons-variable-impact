import React, { useState, Fragment } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.scss'
import classNames from 'classnames'
import path from 'path'
import csv from 'csvtojson'
import { unique, parseVariablesFromExp, parseMeasureGroups} from '../src/utils.js'

export default function Home({ variables, sections }) {

  const [varAvail, setVarAvail] = useState(variables.reduce((a, v) => {
    a[v.name] = (v.status === 'Done' && v.missing !== null && v.missing < 0.3)
    return a
  }, {}))

  const [details, setDetails] = useState(false)
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('ascending')

  const updateVarAvail = (varName) => {
    setVarAvail({
      ...varAvail,
      [varName]: !varAvail[varName]
    })
  }

  const setVars = (value) => {
    setVarAvail(variables.reduce((a, v) => {
      a[v.name] = value
      return a
    }, {}))
  }

  const resetVars = () => {
    setVarAvail(variables.reduce((a, v) => {
      a[v.name] = (v.status === 'Done' && v.missing !== null && v.missing < 0.3)
      return a
    }, {}))
  }

  const toggleDetails = () => {
    setDetails(!details)
  }

  const toggleSortVars = (field) => {
    let direction

    // If the same field, toggle the direction
    if(field === sortField) {
      direction = sortDirection === 'ascending' ? 'descending' : 'ascending'
    } else if(field === 'name' || field === 'status' || field === 'priority') {
      direction = 'ascending'
    } else {
      direction = 'descending'
    }

    setSortField(field)
    setSortDirection(direction)
    sortVarsBy(field, direction)
  }

  const sortVarsBy = (field, direction) => {
    console.log(`sortVarsBy field:${field} direction: ${direction}`)

    if(field === 'name') {
      variables.sort(direction === 'ascending'
        ? (a, b) => compareNames(a, b)
        : (a, b) => compareNames(b, a)
      )
    } else if (field === 'priority') {
      variables.sort(direction === 'ascending'
        ? (a, b) => comparePriority(a, b)
        : (a, b) => comparePriority(b, a)
      )
    } else if (field === 'missing') {
      variables.sort(direction === 'ascending'
        ? (a, b) => compareMissing(a, b)
        : (a, b) => compareMissing(b, a)
      )
    } else if(field === 'status') {
      return variables.sort(direction === 'ascending'
        ? (a, b) => compareStatus(a, b)
        : (a, b) => compareStatus(b, a)
      )
    }
  }

  const compareNames = (a, b) => {
    return a.name.localeCompare(b.name)
  }

  const comparePriority = (a, b) => {
    let pa = (a.priority === '') ? 1000 : a.priority
    let pb = (b.priority === '') ? 1000 : b.priority
    return pa === pb ? compareNames(a, b) : pa - pb
  }

  const compareMissing = (a, b) => {
    let ma = (a.missing === null) ? -1 : a.missing
    let mb = (b.missing === null) ? -1 : b.missing
    return ma === mb ? compareNames(a, b) : ma - mb
  }

  const STATUS_ORDER = ['Done', 'Fixup', '']

  const compareStatus = (a, b) => {
    if(a.status === b.status) {
      return compareNames(a, b)
    } else {
      let ar = STATUS_ORDER.indexOf(a.status)
      let br = STATUS_ORDER.indexOf(b.status)
      return ar - br
    }
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
              <button onClick={() => setVars(true)}>All</button>
              <button onClick={() => setVars(false)}>None</button>
              <button onClick={resetVars}>Reset</button>
              <button onClick={toggleDetails}>{`${details ? 'Hide' : 'Show'} Details`}</button>
            </div>

            <table className={styles.variableTable}>
              <thead>
                <tr>
                  {/*const SortLabel = (name, sortField, sortDirection) => {*/}

                  <th onClick={() => toggleSortVars('name')}>
                    <SortLabel field='name' sortField={sortField} sortDirection={sortDirection}>Name</SortLabel>
                  </th>
                  <th onClick={() => toggleSortVars('priority')}>
                    <SortLabel field='priority' sortField={sortField} sortDirection={sortDirection}>Priority</SortLabel>
                  </th>
                  <th onClick={() => toggleSortVars('missing')}>
                    <SortLabel field='missing' sortField={sortField} sortDirection={sortDirection}>Missing</SortLabel>
                  </th>
                  <th onClick={() => toggleSortVars('status')}>
                    <SortLabel field='status' sortField={sortField} sortDirection={sortDirection}>Status</SortLabel>
                  </th>
                </tr>
              </thead>
              <tbody>
              {
                variables.map(v =>
                  <tr key={v.name} onClick={() => updateVarAvail(v.name)}>
                    <td><CheckBox key={v.name} id={v.name} variable={v} checked={varAvail[v.name]} /></td>
                    <td>{v.priority}</td>
                    <td><span className={(v.missing >= 0.3 || v.missing === null) ? styles.missingVar : undefined}>{v.missing !== null ? (v.missing * 100).toFixed(2)+'%' : 'N/A'}</span></td>
                    <td>{v.status}</td>
                  </tr>
                )
              }
              </tbody>
            </table>
          </div>
          <div className={styles.impact}>
            <h1>Commons Variable Impact Analyzer</h1>
            <div><i>Missing sections highlighted in red and missing variables are bold.</i></div>
            {
              sections.map((s,i) =>
                <MeasureSection key={i} section={s} varAvail={varAvail} details={details}/>
              )
            }
          </div>
        </div>
      </main>
    </div>
  )
}

const SortLabel = ({field, sortField, sortDirection, children}) => {
  return (
    <span className={classNames(field === sortField && [styles.sorted, styles[sortDirection]])}>{children}</span>
  )
}

const CheckBox = ({id, checked}) => {
  return (
    <div className={styles.variable}>
      <input
        className={styles.checkbox}
        type='checkbox' id={id}
        checked={checked}
        readOnly={true}
      />
      <label
        className={styles.label}>{id}</label>
    </div>
  )
}

const MeasureSection = ({section, varAvail, details}) => {
  let contents

  if(section.measures) {
    contents = (
    <div>
      <h2>{section.name}</h2>
      {
        section.measures.map(measure => (
          <MeasureBlock
            key={measure.id}
            measure={measure}
            varAvail={varAvail}
            details={details}
          />
        ))
      }
    </div>
    )
  } else if(section.columns) {
    contents = (
      <div className={styles.sectionTable}>
        {
          section.columns.map((c, i) => (
            <div key={i} className={styles.sectionColumn}>
              {
                c.measures.map((measure, i) => (
                  <MeasureBlock
                    key={i}
                    className={styles.sectionCell}
                    measure={measure}
                    varAvail={varAvail}
                    details={details}
                  />
                ))
              }
            </div>
          ))
        }
      </div>
    )
  } else if(section.filterSubclasses) {
    contents = (
      <div>
        <h2>{section.name}</h2>
        {
          section.filterSubclasses.map((filterSubclass, i) => (
            <FilterBlock
              key={i}
              filterSubclass={filterSubclass}
              varAvail={varAvail}
              details={details}
            />
          ))
        }
      </div>
    )
  }

  return <div className={styles.section}>{contents}</div>
}

const MeasureBlock = ({className, measure, varAvail, details}) => {
  // If one variable isn't available, the measure isn't available
  const measureAvailable = !measure.variables.find(v => !varAvail[v])

  return (
    <div
      className={classNames(
        className,
        styles.dataBlock,
        measureAvailable ? styles.available: styles.unavailable
      )}>
      {
        details && (
          <>
            <div className={styles.blockTitle}>
              {measure.id}: {measure.name}
            </div>
            <div className={styles.blockVariableList}>
              {
                measure.variables.map((v, i) => (
                  <span key={i} className={classNames({[styles.blockVariableUnavailable]: !varAvail[v]})}>
                {`${i > 0 ? ', ': ''}${v}`}
              </span>
                ))
              }
            </div>
          </>
        )
      }
    </div>
  )
}

const FilterBlock = ({className, filterSubclass, varAvail, details}) => {
  // If one variable isn't available, the filter isn't available
  const available = !filterSubclass.variables.find(v => !varAvail[v])

  return (
    <div
      className={classNames(
        className,
        styles.dataBlock,
        available ? styles.available: styles.unavailable
      )}>
      {
        details && (
          <>
            <div className={styles.blockTitle}>
              {filterSubclass.id}: {filterSubclass.name} {filterSubclass.description}
            </div>
            <div className={styles.blockVariableList}>
              {
                filterSubclass.variables.map((v, i) => (
                  <span key={i} className={classNames({[styles.blockVariableUnavailable]: !varAvail[v]})}>
                {`${i > 0 ? ', ': ''}${v}`}
              </span>
                ))
              }
            </div>
          </>
        )
      }
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
  const filterClassesData = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Filter Classes.csv'))
  const filterSubclassesData = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Filter Subclasses.csv'))
  const filterGroupsData = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Filter Groups.csv'))
  const filtersData = await csv().fromFile(path.join(process.cwd(), 'data', 'Yolo CTP - Copy of MFJ\'s MASTER FILE - Filters.csv'))

  // Create a master map of variables
  const variables = codebook.reduce((a, v) => {
    let name = v['Variable']
    if(name.length > 0) {
      a[name] = {
        name: name,
        status: '',
        priority: '',
        missing: null,
        dependsOn: [],
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
      v.priority = parseInt(p['Priority'])
      v.missing = p['Current Missingness Forecast'] ? parseFloat(p['Current Missingness Forecast']) / 100 : null

      let dependsOn  = [...(p['Depends On Variable'].split(',').map(v => v.trim()))]
      dependsOn.forEach(d => {
        if(d.length > 0) {
          if(!variables[d]) {
            console.error(`Progress Variable: ${name} depends on variable ${d} not found in codebook`)
          } else if(!variableProgress.find(vp => vp['Variable'] === d)) {
            // Only include variables found in variable progress
              console.error(`Progress Variable: ${name} depends on variable ${d} not found in variable progress sheet`)
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

  const findMeasureById = (id) => {
    return measures.find(m => m.id === parseInt(id))
  }

  const filterSubclasses = filterSubclassesData.map(fsc => ({
    id: parseInt(fsc['DB ID']),
    filterClass: filterClassesData.find(fc => fc['DB ID'] === fsc['Filter Class'])['Name'],
    order: parseInt(fsc['Order']),
    name: fsc['Name'],
    description: fsc['Description'],
    variables: unique(filterGroupsData
      .filter(fg => fg['Filter Subclass'] === fsc['DB ID'])
      .reduce((acc, fg) => {
        acc.push(...fg['Filters']
          .trim()
          .split(',')
          .map(id => parseVariablesFromExp(filtersData.find(d => d['DB ID'] === id)['Expression']))
          .flat()
        )
        return acc
      }, []))
  }))

  // Remove all variables that aren't referenced in by the measures or filters
  const variableList = Object.values(variables)
    .filter(v =>
      v.priority.length > 0 || // It has any status
      measures.find(m => m.variables.find(mv => mv === v.name)) || // or is referenced by a measure
      filterSubclasses.find(f => f.variables.find(fv => fv === v.name)) // Or is referenced by a filter
  ).sort((a, b) => a.name.localeCompare(b.name))

 const sections = []

  // Add the goals measure, this comes from directus, we'll just hardcode the id here
  sections.push({
    name: 'Prosecutor Goal',
    measures: [findMeasureById(656)]
  })

  // Add the caseflow sections
  caseflowSectionData.forEach(s => {
    sections.push({
      name: 'Monthly Caseflow: ' + s['Name'].trim(),
      measures: [findMeasureById(s['Measure'])]
    })

    sections.push({
      columns: [{
        name: 'Data Viz',
        measures: s['Pie Chart Breakdown']
          .split(',')
          .map(v => findMeasureById(v))
      }, {
        name: 'Misdemeanor',
        measures: [
          findMeasureById(s['Misdemeanor']),
          ...s['Misdemeanor Breakdown'].split(',').map(v => findMeasureById(v))
        ]
      }, {
        name: 'Felony',
        measures: [
          findMeasureById(s['Felony']),
          ...s['Felony Breakdown'].split(',').map(v => findMeasureById(v))
        ]
      }]
    })

    if(sections.length > 0 && s['Pie Chart Breakdown Companions'].length > 0) {
      // Add companions to the last section
      let lastSection = sections[sections.length - 1]
      if(lastSection.columns && lastSection.columns.length === 3) {
        lastSection.columns[0].measures.push(...(s['Pie Chart Breakdown Companions'].split(',').map(v => findMeasureById(v))))
        lastSection.columns[1].measures.push(...(s['Misdemeanor Companions'].split(',').map(v => findMeasureById(v))))
        lastSection.columns[2].measures.push(...(s['Felony Companions'].split(',').map(v => findMeasureById(v))))
      }
    }
  })

  sections.push({
    name: 'Filters',
    filterSubclasses: filterSubclasses
  })

  // Add the Other Caseflow Explore Measures
  sections.push({
    name: 'Monthly Case Flow: Explore Only Measures',
    measures: measures
      .filter(m =>
        m.measureGroups.find(g => g.type === 'Case Flow Detail') &&
        !m.measureGroups.find(g => g.type === 'Case Flow')
      )
      .sort((a, b) => (a.id - b.id))
  })

  // Add the annual measures
  let annualMeasures = measures
    .filter(m => m.measureGroups.find(g => g.type === 'Performance' && g.group === 'Primary'))
    .sort((a, b) => (a.id - b.id))

  sections.push({
    name: 'Annual Measures',
    measures: annualMeasures
  })

  sections.push({
    name: 'Annual Measure: Companions',
    measures: measures
      .filter(m =>
        m.measureGroups.find(g => g.type === 'Performance' && g.group === 'Companion') &&
        annualMeasures.find(a => a.relatedMeasures.find(r => r === m.id))
      )
      .sort((a, b) => (a.id - b.id))
  })

  return {
    props: {
      variables: variableList,
      sections
    }
  }
}

