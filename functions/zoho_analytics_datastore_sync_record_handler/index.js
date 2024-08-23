const catalystSDK = require('zcatalyst-sdk-node')

const AppConstants = require('./constants')
const { AnalyticsService } = require('./services')

const isJsonObject = (object) => {
  return object && typeof object === 'object'
}

module.exports = async (event, context) => {
  try {
    const sourceType = event.getSource()
    if (sourceType === 'Datastore') {
      const data = event.data
      const action = event.getAction()
      const tableId = event.getSourceEntityId()
      const catalyst = catalystSDK.initialize(context)
      const { table_name: tableName } = await catalyst
        .datastore()
        .getTableDetails(tableId)
        .then((table) => table.toJSON())
      const orgId = process.env[AppConstants.Env.OrgId]
      const workspaceId = process.env[AppConstants.Env.WorkspaceId]
      const viewId = process.env[tableName + '_' + AppConstants.Env.ViewId]
      if (!viewId) {
        console.log('Error ::: The table name provided in the configuration is either incorrect or the format of the view ID in the configuration is wrong. The correct format is `${tableName}_VIEW_ID`.')
        context.closeWithFailure()
      }
      const analyticsInstance = await AnalyticsService.getInstance(catalyst)
      const viewInstance = analyticsInstance.getViewInstance(orgId, workspaceId, viewId)
      if (action === 'Insert') {
        for (let i = 0; i < data.length; i++) {
          const element = isJsonObject(data[i][tableName]) ? data[i][tableName] : data[i]
          await viewInstance.addRow(element)
        }
      } else if (action === 'Update') {
        for (let i = 0; i < data.length; i++) {
          const element = isJsonObject(data[i][tableName]) ? data[i][tableName] : data[i]
          const result = await viewInstance.updateRow(element, 'ROWID = ' + element.ROWID)
          if (result.updatedRows == 0) {
            console.log("Updating ROWID = '" + element.ROWID + "' failed.")
          }
        }
      } else {
        if (Array.isArray(data)) {
          for (let i = 0; i < data.length; i++) {
            const element = isJsonObject(data[i][tableName]) ? data[i][tableName] : data[i]
            const result = await viewInstance.deleteRow('ROWID = ' + element.ROWID)
            if (result == 0) {
              console.log("Deleting ROWID = '" + element.ROWID + "' failed because it is not present in Analytics.")
            }
          }
        } else {
          const result = await viewInstance.deleteRow('ROWID = ' + data.ROWID)
          if (result == 0) {
            console.log("Deleting ROWID = '" + data.ROWID + "' failed because it is not present in Analytics.")
          }
        }
      }
    }
    context.closeWithSuccess()
  } catch (error) {
    console.log('Error :::', error)
    context.closeWithFailure()
  }
}
