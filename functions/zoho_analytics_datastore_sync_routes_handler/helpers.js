const fs = require('fs')
const axios = require('axios')

const AdmZip = require('adm-zip')
const AppConstants = require('./constants')
const { AnalyticsService, FileService } = require('./services')

async function createJob (app, query) {
  const bulkRead = app.datastore().table(query.tableName).bulkJob('read')
  await bulkRead.createJob({
    page: query.page,
    select_columns: query.columns
  }, {
    url: query.callbackURL,
    headers: { 'catalyst-codelib-secret-key': process.env[AppConstants.Env.CodelibSecretKey] }
  })
  return `Successfully initiated bulk read job for page -  ${query.page}`
}

async function importBulkData (environment, catalystApp, tableName, query, orgId, workspaceId, viewId, callbackUrl) {
  const credentials = {
    bulk_connector: {
      client_id: process.env[AppConstants.Env.ClientId],
      client_secret: process.env[AppConstants.Env.ClientSecret],
      auth_url: process.env[AppConstants.Env.AuthHost],
      refresh_url: process.env[AppConstants.Env.AuthHost],
      refresh_token: process.env[AppConstants.Env.RefreshToken]
    }
  }
  const accessToken = await catalystApp.connection(credentials).getConnector('bulk_connector').getAccessToken()
  const file = await axios({
    method: 'get',
    url: query.downloadURL,
    responseType: 'arraybuffer',
    headers: {
      Authorization: 'Zoho-oauthtoken ' + accessToken,
      Accept: 'application/vnd.catalyst.v2+json',
      environment
    }
  })
  const fileService = new FileService()
  const localFilePath = fileService.createTempFilePath(`${tableName}_${query.page}`)
  await fs.promises.writeFile(localFilePath, file.data)
  const zip = new AdmZip(localFilePath)
  const csvPath = fileService.createTempFilePath('Data')
  zip.extractAllTo(csvPath)
  const filePath = csvPath + '/Table-' + tableName + '.csv'
  const analyticsInstance = AnalyticsService.getInstance()
  const bulkInstance = analyticsInstance.getBulkInstance(orgId, workspaceId)
  await bulkInstance.importBulkData(viewId, 'append', 'csv', true, filePath, { callbackUrl })
  return `Zoho Analytics import has started for table ${query.tableName} - ${query.page}`
}

exports.createJob = createJob
exports.importBulkData = importBulkData
