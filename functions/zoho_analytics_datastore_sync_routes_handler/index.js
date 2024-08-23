'use strict'

const express = require('express')
const catalyst = require('zcatalyst-sdk-node')

const Helpers = require('./helpers')
const AppConstants = require('./constants')
const { AppError, ErrorHandler } = require('./utils')
const { AuthService, AnalyticsService } = require('./services')

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  try {
    const url = req.url
    if (url.startsWith('/import-analytics')) {
      const reqQuery = req.query
      if (!AuthService.getInstance().isValidRequest(reqQuery[AppConstants.Headers.CodelibSecretKey])) {
        throw new AppError(401, "You don't have permission to perform this operation. Kindly contact your administrator for more details.")
      }
    } else {
      if (!AuthService.getInstance().isValidRequest(req.get(AppConstants.Headers.CodelibSecretKey))) {
        throw new AppError(401, "You don't have permission to perform this operation. Kindly contact your administrator for more details.")
      }
    }
    next()
  } catch (err) {
    const { statusCode, ...others } = ErrorHandler.getInstance().processError(err)

    res.status(statusCode).send(others)
  }
})

app.post('/import', async (req, res) => {
  const catalystApp = catalyst.initialize(req)
  const tableName = req.body.tableName
  const cache = catalystApp.cache()
  const segment = await cache.getSegmentDetails(AppConstants.CatalystComponents.Segment.Analytics)
  try {
    const analyticsInstance = AnalyticsService.getInstance()
    const callbackUrl = req.headers['x-zc-project-domain'] + '/server/zoho_analytics_datastore_sync_routes_handler/export-datastore'
    const workspaceId = req.body.workspaceId
    let viewId = req.body.viewId
    const orgId = req.body.orgId
    if (!tableName) {
      throw new AppError(400, "'tableName' cannot be empty.")
    } else if (!orgId) {
      throw new AppError(400, "'orgId' cannot be empty.")
    } else if (!workspaceId) {
      throw new AppError(400, "'workspaceId' cannot be empty.")
    } else if (orgId) {
      const orgExists = (await analyticsInstance.getOrgs()).some(org => org.orgId === orgId);
      if (!orgExists) {
        throw new AppError(404, `Organization id ${orgId} does not exist.`);
      }
    }
    const isTableSyncing = await segment
      .getValue(`${AppConstants.JobName}_${tableName}`)
      .then((value) => Boolean(value))

    if (isTableSyncing) {
      throw new AppError(400, 'The given table is already in the progress of moving data to Analytics.')
    }

    const allTables = await catalystApp.datastore().getAllTables()
    const allTablesJSON = JSON.parse(JSON.stringify(allTables));
    const isTableNamePresent = allTablesJSON.some(item => item.table_name.trim() === tableName);
    if (isTableNamePresent === false) {
      throw new AppError(404, 'No such Table with the given name exists')
    }

    const table = catalystApp.datastore().table(tableName)
    const columns = await table.getAllColumns()
      .then(columns => columns.filter(column => !AppConstants.OmittedColumn.includes(column.column_name)))
      .then(columns => columns.map(column => ({
        COLUMNNAME: column.column_name,
        DATATYPE: AppConstants.DataTypes[column.data_type]
      })))
    if (columns.length <= 1) {
      throw new AppError(400, 'Table should atleast contain one column.')
    }
    if (!viewId) {
      const workspaceInstance = analyticsInstance.getWorkspaceInstance(orgId, workspaceId)
      viewId = await workspaceInstance.createTable({ TABLENAME: tableName, COLUMNS: columns })
    }
    const queries = []
    const countJSON = await catalystApp.zcql().executeZCQLQuery('SELECT COUNT(ROWID) FROM ' + tableName)
    const count = countJSON[0][tableName]['COUNT(ROWID)'];
    const totalPages = Math.ceil(count / AppConstants.MaxRecords)
    for (let j = 1; j <= totalPages; j++) {
      const query = {
        tableName,
        page: j,
        columns: columns.map((column) => column.COLUMNNAME),
        callbackURL: callbackUrl,
        downloadURL: ''
      }
      queries.push(query)
    }
    const json = { orgId, workspaceId, viewId, queries }
    await segment.put(`${AppConstants.JobName}_${tableName}`, json)
    await Helpers.createJob(catalystApp, queries[0])
    res.status(200).send({
      status: 'success',
      message: 'Successfully initiated bulk import to Analytics, and it will be reflected in sometime. Check the logs for more details.'
    })
  } catch (err) {
    const isTablePresent = await segment
      .getValue(`${AppConstants.JobName}_${tableName}`)
      .then((value) => Boolean(value))
    isTablePresent ? await segment.delete(`${AppConstants.JobName}_${tableName}`) : null
    const { statusCode, ...others } = ErrorHandler.getInstance().processError(err)
    res.status(statusCode).send(others)
  }
})

app.post('/export-datastore', async (req, res) => {
  const catalystApp = catalyst.initialize(req)
  const tableName = req.body.tableName
  const cache = catalystApp.cache()
  const segment = await cache.getSegmentDetails(AppConstants.CatalystComponents.Segment.Analytics)
  try {
    const body = req.body
    if (!body.status.includes('Completed')) {
      throw new Error(JSON.stringify(body.results.description))
    }
    const page = parseInt(body.query[0].details.page)
    let message = ''
    const { queries, viewId, workspaceId, orgId } = await segment.getValue(`${AppConstants.JobName}_${tableName}`).then((value) => JSON.parse(value))

    queries[page - 1].downloadURL = body.results.download_url
    await segment.update(`${AppConstants.JobName}_${tableName}`, JSON.stringify({ queries, viewId, workspaceId, orgId }))

    if (queries[page]) {
      message = await Helpers.createJob(catalystApp, queries[page])
    } else {
      const callbackUrl = `${req.headers['x-zc-project-domain']}/server/zoho_analytics_datastore_sync_routes_handler/import-analytics?tableName=${tableName}&catalyst-codelib-secret-key=${process.env[AppConstants.Env.CodelibSecretKey]}&page=${queries[0].page}`
      const environment = req.headers['x-zc-environment']
      message = await Helpers.importBulkData(environment, catalystApp, tableName, queries[0], orgId, workspaceId, viewId, callbackUrl)
    }
    console.log(message)
    res.status(200).send({
      status: 'success',
      message
    })
  } catch (error) {
    const isTablePresent = await segment
      .getValue(`${AppConstants.JobName}_${tableName}`)
      .then((value) => Boolean(value))
    isTablePresent ? await segment.delete(`${AppConstants.JobName}_${tableName}`) : null
    const { statusCode, ...others } = ErrorHandler.getInstance().processError(error)
    res.status(statusCode).send(others)
  }
})

app.post('/import-analytics', async (req, res) => {
  const catalystApp = catalyst.initialize(req)
  const tableName = req.body.tableName
  const cache = catalystApp.cache()
  const segment = await cache.getSegmentDetails(AppConstants.CatalystComponents.Segment.Analytics)
  try {
    const body = req.body
    const page = req.query.page
    if (!body.jobStatus.includes('COMPLETED')) {
      throw new Error(JSON.stringify(body.jobInfo))
    }
    const { queries, viewId, workspaceId, orgId } = await segment.getValue(`${AppConstants.JobName}_${tableName}`).then((value) => JSON.parse(value))
    let message = ''

    if (queries[page]) {
      const environment = req.headers['x-zc-environment']
      const callbackUrl = `${req.headers['x-zc-project-domain']}/server/zoho_analytics_datastore_sync_routes_handler/import-analytics?tableName=${tableName}&catalyst-codelib-secret-key=${process.env[AppConstants.Env.CodelibSecretKey]}&page=${queries[page].page}`
      message = await Helpers.importBulkData(environment, catalystApp, tableName, queries[page], orgId, workspaceId, viewId, callbackUrl)
    } else {
      await segment.delete(`${AppConstants.JobName}_${tableName}`)
      message = 'Data sent successfully to Zoho Analytics'
    }
    console.log(message)
    res.status(200).send({
      status: 'Success',
      message
    })
  } catch (error) {
    const isTablePresent = await segment
      .getValue(`${AppConstants.JobName}_${tableName}`)
      .then((value) => Boolean(value))
    isTablePresent ? await segment.delete(`${AppConstants.JobName}_${tableName}`) : null
    const { statusCode, ...others } = ErrorHandler.getInstance().processError(error)
    res.status(statusCode).send(others)
  }
})

app.post('/row', async (req, res) => {
  try {
    const orgId = req.body.orgId
    const viewId = req.body.viewId
    const workspaceId = req.body.workspaceId
    const rowId = req.body.rowId
    const tableName = req.body.tableName
    const action = req.body.action
    if (!tableName) {
      throw new AppError(400, "'tableName' cannot be empty.")
    } else if (!rowId) {
      throw new AppError(400, "'rowId' cannot be empty.")
    } else if (!orgId) {
      throw new AppError(400, "'orgId' cannot be empty.")
    } else if (!action) {
      throw new AppError(400, "'action' cannot be empty.")
    } else if (action.toLowerCase() !== 'insert' && action.toLowerCase() !== 'update') {
      throw new AppError(400, "Only 'insert' or 'update' action is supported.")
    } else if (!workspaceId) {
      throw new AppError(400, "'workspaceId' cannot be empty.")
    } else if (!viewId) {
      throw new AppError(400, "'viewId' cannot be empty.")
    }

    const allTables = await catalystApp.datastore().getAllTables()
    const allTablesJSON = JSON.parse(JSON.stringify(allTables));
    const isTableNamePresent = allTablesJSON.some(item => item.table_name.trim() === tableName);
    if (isTableNamePresent === false) {
      throw new AppError(404, 'No such Table with the given name exists')
    }

    const analyticsInstance = AnalyticsService.getInstance()
    const viewInstance = analyticsInstance.getViewInstance(orgId, workspaceId, viewId)
    const catalystApp = catalyst.initialize(req)
    const data = await catalystApp.datastore().table(tableName).getRow(rowId)
    if (data == null) {
      res.status(400).send({
        status: 'failure',
        message: 'Row not found! Please check whether the given rowId is valid.'
      })
    }
    let message = ''
    if (action.toLowerCase() === 'insert') {
      await viewInstance.addRow(data);
      message = 'The specific row got successfully created in Analytics.'
    } else {
      const update = await viewInstance.updateRow(data, 'ROWID = ' + rowId)
      if (update.updatedRows == 0) {
        return res.status(404).send({
          status: 'failure',
          message: 'Cannot find the row in Analytics.'
        })
      } else {
        message = 'The specific row got successfully updated in Analytics.'
      }
    }
    res.status(200).send({
      status: 'success',
      message
    })
  } catch (error) {
    const { statusCode, ...others } = ErrorHandler.getInstance().processError(error)
    res.status(statusCode).send(others)
  }
})

app.all('*', function (_req, res) {
  res.status(404).send({
    status: 'failure',
    message: "We couldn't find the requested url."
  })
})

module.exports = app
