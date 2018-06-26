import React, { PropTypes } from 'react'
import classnames from 'classnames'
import Link from 'components/common/Link'
import Header from 'components/statusPage/Header'
import IncidentItem from 'components/statusPage/IncidentItem'
import MaintenanceItem from 'components/statusPage/MaintenanceItem'
import { getFormattedDateTime } from 'utils/datetime'
import classes from './History.scss'

export default class History extends React.Component {
  static propTypes = {
    incidents: PropTypes.arrayOf(PropTypes.shape({
      incidentID: PropTypes.string.isRequired,
      updatedAt: PropTypes.string.isRequired
    }).isRequired).isRequired,
    maintenances: PropTypes.arrayOf(PropTypes.shape({
      maintenanceID: PropTypes.string.isRequired,
      updatedAt: PropTypes.string.isRequired
    }).isRequired).isRequired,
    settings: PropTypes.shape({
      serviceName: PropTypes.string
    }).isRequired,
    fetchIncidents: PropTypes.func.isRequired,
    fetchMaintenances: PropTypes.func.isRequired
  }

  constructor () {
    super()
    this.state = {
      isFetching: false
    }
  }

  fetchCallbacks = {
    onLoad: () => { this.setState({isFetching: true}) },
    onSuccess: () => { this.setState({isFetching: false}) },
    onFailure: (msg) => {
      this.setState({isFetching: false, message: msg})
    }
  }

  componentDidMount () {
    this.props.fetchIncidents(this.fetchCallbacks)
    this.props.fetchMaintenances(this.fetchCallbacks)
  }

  renderEventItems = (month, events) => {
    const eventItems = events.map(event => {
      if (event.hasOwnProperty('incidentID')) {
        return (<IncidentItem key={event.incidentID} incidentID={event.incidentID} />)
      } else if (event.hasOwnProperty('maintenanceID')) {
        return (<MaintenanceItem key={event.maintenanceID} maintenanceID={event.maintenanceID} />)
      } else {
        throw new Error('Unknown event: ', event)
      }
    })

    return (
      <li key={month} className={classes['date-item']}>
        <div className={classnames(classes.border)}>{month}</div>
        <div className={classes['events-container']}>
          <ul>{eventItems}</ul>
        </div>
      </li>
    )
  }

  renderEventsByMonth = (events) => {
    let months = {}
    events.forEach(event => {
      const updatedAt = getFormattedDateTime(event.updatedAt, 'MMMM YYYY')
      if (!months.hasOwnProperty(updatedAt)) {
        months[updatedAt] = [event]
      } else {
        months[updatedAt].push(event)
      }
    })

    Object.keys(months).map(month => months[month].sort((a, b) => {
      if (a.updatedAt < b.updatedAt) return 1
      if (a.updatedAt > b.updatedAt) return -1
      return 0
    }))

    return Object.keys(months).map(month =>
      this.renderEventItems(month, months[month])
    )
  }

  render () {
    const { incidents, maintenances } = this.props
    const events = incidents.concat(maintenances)
    const eventsByMonth = this.renderEventsByMonth(events)

    return (
      <div>
        <Header />
        <ul className={classes['months-container']} >
          <h4 className={classnames(classes.title)}>Incident History</h4>
          {eventsByMonth}
        </ul>
        <span className={classnames(classes.link)}><Link link='/' text='Current Incidents' /></span>
      </div>
    )
  }
}
