import React, { PropTypes } from 'react'
import ReactTooltip from 'react-tooltip'
import LabeledDropdownList from 'components/common/LabeledDropdownList'
import { userPoolId } from 'utils/settings'
import { regions } from 'utils/status'
import classes from './CloudWatchMetricsSelector.scss'

const statisticsList = [
  'Average',
  'Minimum',
  'Maximum',
  'Sum',
  'SampleCount',
  'p99',
  'p95',
  'p90',
  'p50',
  'p10'
]

export default class CloudWatchMetricsSelector extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    filters: PropTypes.object,
    metrics: PropTypes.arrayOf(PropTypes.object.isRequired),
    props: PropTypes.object,
    fetchExternalMetrics: PropTypes.func.isRequired
  }

  static get monitoringServiceName () {
    return 'CloudWatch'
  }

  constructor (props) {
    super(props)

    const matched = userPoolId.match(/([a-z0-9-]+)_.+/)
    if (matched && matched.length === 2) {
      this.region = matched[1]
    } else {
      console.error('failed to get region from', userPoolId)
      this.region = 'us-east-1'
    }

    this.regionNames = regions.map(r => r.name)

    const region = (props.props && props.props.Region) ? props.props.Region : this.region
    const regionName = regions.find(r => r.id === region).name
    const namespace = props.props ? props.props.Namespace : ''
    const metric = props.props ? this.buildMetricExpression(props.props) : ''
    const statistics = props.props ? props.props.Statistics : statisticsList[0]
    this.state = {
      regionName,
      namespace,
      metric,
      statistics,
      isFetching: false
    }
  }

  callbacks = {
    onLoad: () => { this.setState({isFetching: true}) },
    onSuccess: () => { this.setState({isFetching: false}) },
    onFailure: () => {
      this.setState({isFetching: false})
    }
  }

  componentDidMount () {
    if (this.needFetching()) {
      const regionID = regions.find(r => r.name === this.state.regionName).id
      this.props.fetchExternalMetrics(CloudWatchMetricsSelector.monitoringServiceName,
                                      {region: regionID},
                                      this.callbacks)
    }
  }

  needFetching = () => {
    if (!this.props.metrics || !this.props.filters) { return true }

    const regionOfCurrentMetrics = regions.find(r => r.id === this.props.filters.region)
    return regionOfCurrentMetrics.name !== this.state.regionName
  }

  handleChangeRegion = (value) => {
    this.setState({regionName: value, namespace: '', metric: ''})

    const regionID = regions.find(r => r.name === value).id
    this.props.fetchExternalMetrics(CloudWatchMetricsSelector.monitoringServiceName,
                                    {region: regionID},
                                    this.callbacks)
  }

  handleChangeNamespace = (value) => {
    this.setState({namespace: value, metric: ''})
  }

  handleChangeMetric = (value) => {
    this.setState({metric: value})

    const { metricName, dimensions } = this.parseMetricExpression(value)
    const regionID = regions.find(r => r.name === this.state.regionName).id
    this.props.onChange({
      Region: regionID,
      Namespace: this.state.namespace,
      MetricName: metricName,
      Dimensions: dimensions,
      Statistics: this.state.statistics
    })
  }

  handleChangeStatistics = (value) => {
    this.setState({statistics: value})

    const { metricName, dimensions } = this.parseMetricExpression(this.state.metric)
    const regionID = regions.find(r => r.name === this.state.regionName).id
    this.props.onChange({
      Region: regionID,
      Namespace: this.state.namespace,
      MetricName: metricName,
      Dimensions: dimensions,
      Statistics: value
    })
  }

  buildMetricExpression = (metric) => {
    const dimensions = metric.Dimensions.map((dim) => {
      return `${dim.Name}: ${dim.Value}`
    })
    return `${metric.MetricName} - [${dimensions.join(', ')}]`
  }

  parseMetricExpression = (value) => {
    let splitStr = ' - ['
    let splitIndex = value.indexOf(splitStr)
    if (splitIndex === -1) {
      // The spaces before and after '-' are somehow omitted in IE11.
      splitStr = '-['
      splitIndex = value.indexOf(splitStr)
    }
    const metricName = value.substr(0, splitIndex)

    const rawDims = value.slice(splitIndex + splitStr.length, -1)
    const dimensions = rawDims.split(', ').map((rawDim) => {
      const splitStr = ': '
      const splitIndex = rawDim.indexOf(splitStr)
      const dimName = rawDim.substr(0, splitIndex)
      const dimValue = rawDim.substr(splitIndex + splitStr.length)
      return {Name: dimName, Value: dimValue}
    })

    return { metricName, dimensions }
  }

  render () {
    let namespaces = ['']
    let metrics = ['']
    if (!this.needFetching()) {
      const namespaceSet = new Set()
      this.props.metrics.forEach((metric) => {
        namespaceSet.add(metric.Namespace)
      })
      namespaces = namespaces.concat(Array.from(namespaceSet).sort())

      this.props.metrics.forEach((metric) => {
        if (metric.Namespace === this.state.namespace) {
          metrics.push(this.buildMetricExpression(metric))
        }
      })
      metrics.sort()
    } else {
      namespaces = [this.state.namespace]
      metrics = [this.state.metric]
    }

    const linkToMetricsPage = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#metricsV2:`

    return (
      <div>
        <LabeledDropdownList
          id='namespace' label='CloudWatch Region' onChange={this.handleChangeRegion}
          list={this.regionNames} initialValue={this.state.regionName} disabled={this.state.isFetching}
          infoIconID='cloudWatchInfo' />

        <LabeledDropdownList
          id='namespace' label='CloudWatch Namespace' onChange={this.handleChangeNamespace}
          list={namespaces} initialValue={this.state.namespace} disabled={this.state.isFetching}
          showSpinner={this.state.isFetching} />

        <LabeledDropdownList
          id='name' label='CloudWatch MetricName & Dimensions' onChange={this.handleChangeMetric}
          list={metrics} initialValue={this.state.metric} disabled={this.state.isFetching}
          showSpinner={this.state.isFetching} />

        <LabeledDropdownList
          id='statistics' label='CloudWatch Statistics' onChange={this.handleChangeStatistics}
          list={statisticsList} initialValue={this.state.statistics} disabled={this.state.isFetching} />

        <ReactTooltip id='cloudWatchInfo' effect='solid' place='right' delayHide={5000} className={classes.tooltip}>
          <div>
            Access
            <a href={linkToMetricsPage} className={classes.link} target='_blank'>
              the CloudWatch Management Console
            </a>
            to check graphs.
          </div>
        </ReactTooltip>
      </div>
    )
  }
}
