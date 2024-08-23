/* $Id$ */
const https = require('https')
const fs = require('fs')
const querystring = require('querystring')
const request = require('request')
const analyticsURI = 'analyticsapi.zoho.com'
const accountsURI = 'accounts.zoho.com'
const clientVersion = '2.1.0'

class AnalyticsClient {
  constructor(clientId, clientSecret, refreshToken, accessToken) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.refreshToken = refreshToken
    this.accessToken = accessToken
  }

  /**
     * Returns list of all accessible organizations.
     * @method getOrgs
     * @returns {JSONArray} Organization list.
     * @throws {Error} If the request failed due to some error.
     */
  async getOrgs() {
    const uriPath = '/restapi/v2/orgs'
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', null, header)
    return result.orgs
  }

  /**
     * Returns list of all accessible workspaces.
     * @method getWorkspaces
     * @returns {JSONArray} Workspace list.
     * @throws {Error} If the request failed due to some error.
     */
  async getWorkspaces() {
    const uriPath = '/restapi/v2/workspaces'
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', null, header)
    return result
  }

  /**
     * Returns list of owned workspaces.
     * @method getOwnedWorkspaces
     * @returns {JSONArray} Workspace list.
     * @throws {Error} If the request failed due to some error.
     */
  async getOwnedWorkspaces() {
    const uriPath = '/restapi/v2/workspaces/owned'
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', null, header)
    return result.workspaces
  }

  /**
     * Returns list of shared workspaces.
     * @method getSharedWorkspaces
     * @returns {JSONArray} Workspace list.
     * @throws {Error} If the request failed due to some error.
     */
  async getSharedWorkspaces(config = {}) {
    const uriPath = '/restapi/v2/workspaces/shared'
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', null, header)
    return result.workspaces
  }

  /**
     * Returns list of recently accessed views.
     * @method getRecentViews
     * @returns {JSONArray} View list.
     * @throws {Error} If the request failed due to some error.
     */
  async getRecentViews() {
    const uriPath = '/restapi/v2/recentviews'
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', null, header)
    return result.views
  }

  /**
     * Returns list of all accessible dashboards.
     * @method getDashboards
     * @returns {JSONArray} Dashboard list.
     * @throws {Error} If the request failed due to some error.
     */
  async getDashboards() {
    const uriPath = '/restapi/v2/dashboards'
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', null, header)
    return result
  }

  /**
     * Returns list of owned dashboards.
     * @method getOwnedDashboards
     * @returns {JSONArray} Dashboard list.
     * @throws {Error} If the request failed due to some error.
     */
  async getOwnedDashboards() {
    const uriPath = '/restapi/v2/dashboards/owned'
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', null, header)
    return result.views
  }

  /**
     * Returns list of shared dashboards.
     * @method getSharedDashboards
     * @returns {JSONArray} Dashboard list.
     * @throws {Error} If the request failed due to some error.
     */
  async getSharedDashboards() {
    const uriPath = '/restapi/v2/dashboards/shared'
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', null, header)
    return result.views
  }

  /**
     * Returns details of the specified workspace.
     * @method getWorkspaceDetails
     * @param {String} workspaceId - The ID of the workspace.
     * @returns {Object} Workspace details.
     * @throws {Error} If the request failed due to some error.
     */
  async getWorkspaceDetails(workspaceId) {
    const uriPath = '/restapi/v2/workspaces/' + workspaceId
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', null, header)
    return result.workspaces
  }

  /**
     * Returns details of the specified view.
     * @method getViewDetails
     * @param {String} viewId - The ID of the view.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {Object} View details.
     * @throws {Error} If the request failed due to some error.
     */
  async getViewDetails(viewId, config = {}) {
    const uriPath = '/restapi/v2/views/' + viewId
    const header = {}
    const result = await this.handleV2Request(uriPath, 'GET', config, header)
    return result.views
  }

  /**
     * Returns a new OrgAPI instance.
     * @method getOrgInstance
     * @param {String} orgId - The ID of the organization.
     */
  getOrgInstance(orgId) {
    const orgInstance = new OrgAPI(this, orgId)
    return orgInstance
  }

  /**
     * Returns a new WorkspaceAPI instance.
     * @method getWorkspaceInstance
     * @param {String} orgId - The ID of the organization.
     * @param {String} workspaceId - The ID of the workspace.
     */
  getWorkspaceInstance(orgId, workspaceId) {
    const workspaceInstance = new WorkspaceAPI(this, orgId, workspaceId)
    return workspaceInstance
  }

  /**
     * Returns a new ViewAPI instance.
     * @method getViewInstance
     * @param {String} orgId - The ID of the organization.
     * @param {String} workspaceId - The ID of the workspace.
     * @param {String} viewId - The ID of the view.
     */
  getViewInstance(orgId, workspaceId, viewId) {
    const viewInstance = new ViewAPI(this, orgId, workspaceId, viewId)
    return viewInstance
  }

  /**
     * Returns a new BulkAPI instance.
     * @method getBulkInstance
     * @param {String} orgId - The ID of the organization.
     * @param {String} workspaceId - The ID of the workspace.
     */
  getBulkInstance(orgId, workspaceId) {
    const bulkInstance = new BulkAPI(this, orgId, workspaceId)
    return bulkInstance
  }

  async handleImportRequest(uriPath, config, header, filePath, data = null) {
    if (this.accessToken == null) {
      this.accessToken = await this.getOauth()
    }
    return await this.sendImportRequest(uriPath, config, header, filePath, data).catch(async error => {
      if (error.errorCode === '8535') {
        this.accessToken = await this.getOauth()
        return await this.sendImportRequest(uriPath, config, header, filePath, data)
      } else {
        throw error
      }
    })
  }

  sendImportRequest(uriPath, config, header = {}, filePath, data) {
    header['User-Agent'] = 'Analytics NodeJS Client v' + clientVersion
    header.Authorization = 'Zoho-oauthtoken ' + this.accessToken

    if (config !== null) {
      const encodedConfig = encodeURIComponent(JSON.stringify(config))
      const configParam = 'CONFIG' + '=' + encodedConfig
      uriPath = uriPath + '?' + configParam
    }
    const url = 'https://' + analyticsURI + uriPath

    if (data !== null) {
      return new Promise(function (resolve, reject) {
        //                    const { Readable } = require("stream")
        //                    const readable = Readable.from(data).then()
        const formData = {
          DATA: data
        }
        header['Content-Type'] = 'application/x-www-form-urlencoded'
        request.post({ url, headers: header, formData, secureProtocol: 'TLSv1_2_method' }, (err, resp, body) => {
          if (err) {
            reject(JSON.parse(err))
          } else {
            const respJSON = (JSON.parse(body))
            if (resp.statusCode !== 200) {
              reject(respJSON.data)
            } else {
              resolve(respJSON.data)
            }
          }
        })
      })
    } else {
      return new Promise(function (resolve, reject) {
        const zohofile = fs.createReadStream(filePath)
        zohofile.on('error', err => { reject(err) })
        zohofile.once('readable', function () {
          const formData = {
            FILE: zohofile
          }

          request.post({ url, headers: header, formData, secureProtocol: 'TLSv1_2_method' }, (err, resp, body) => {
            if (err) {
              reject(JSON.parse(err))
            } else {
              const respJSON = (JSON.parse(body))
              if (resp.statusCode !== 200) {
                reject(respJSON.data)
              } else {
                resolve(respJSON.data)
              }
            }
          })
        })
      })
    }
  }

  async handleExportRequest(uriPath, filePath, config, header) {
    if (this.accessToken == null) {
      this.accessToken = await this.getOauth()
    }
    return await this.sendExportRequest(uriPath, filePath, config, header).catch(async error => {
      if (error.errorCode === '8535') {
        this.accessToken = await this.getOauth()
        return await this.sendExportRequest(uriPath, filePath, config, header)
      } else {
        throw error
      }
    })
  }

  sendExportRequest(uriPath, filePath, config, header = {}) {
    header['User-Agent'] = 'Analytics NodeJS Client v' + clientVersion
    header.Authorization = 'Zoho-oauthtoken ' + this.accessToken

    if (config !== null) {
      const encodedConfig = encodeURIComponent(JSON.stringify(config))
      const configParam = 'CONFIG' + '=' + encodedConfig
      uriPath = uriPath + '?' + configParam
    }

    return new Promise(function (resolve, reject) {
      const url = 'https://' + analyticsURI + uriPath
      request.get({ url, encoding: null, headers: header, secureProtocol: 'TLSv1_2_method' }, (err, resp, body) => {
        if (err) {
          reject(JSON.parse(err))
        } else {
          if (resp.statusCode !== 200) {
            const respJSON = (JSON.parse(body))
            reject(respJSON.data)
          } else {
            fs.writeFileSync(filePath, body)
          }
        }
      })
    })
  }

  async handleV2Request(uriPath, method, config, header, isExportReq = false) {
    if (this.accessToken == null) {
      this.accessToken = await this.getOauth()
    }
    return await this.sendV2Request(uriPath, method, config, header, isExportReq).catch(async error => {
      if (error.errorCode === '8535') {
        this.accessToken = await this.getOauth()
        return await this.sendV2Request(uriPath, method, config, header, isExportReq)
      } else {
        throw error
      }
    })
  }

  sendV2Request(uriPath, reqMethod, config, header = {}, isExportReq = false) {
    header['User-Agent'] = 'Analytics NodeJS Client v' + clientVersion
    // header.Content-Type = 'application/x-www-form-urlencoded';
    header.Authorization = 'Zoho-oauthtoken ' + this.accessToken

    if (config !== null && Object.keys(config).length !== 0) {
      const encodedConfig = encodeURIComponent(JSON.stringify(config))
      const configParam = 'CONFIG' + '=' + encodedConfig
      uriPath = uriPath + '?' + configParam

      // var contentLength = 'Content-Length';
      // header[contentLength] = configParam.length;
    }

    const options = {
      host: analyticsURI,
      path: uriPath,
      headers: header,
      method: reqMethod,
      secureProtocol: 'TLSv1_2_method'
    }

    return new Promise(function (resolve, reject) {
      const req = https.request(options, (resp) => {
        let data = ''
        resp.setEncoding(null)
        resp.on('data', (chunk) => {
          data += chunk
        })

        resp.on('end', () => {
          const respCode = (resp.statusCode).toString()
          const isRequestFailed = Boolean(!respCode.startsWith('2'))
          const hasResponse = Boolean(respCode === '200')

          if (isRequestFailed) {
            const respJSON = (JSON.parse(data))
            reject(respJSON.data)
          } else if (isExportReq) {
            resolve(data)
          } else if (hasResponse) {
            const respJSON1 = (JSON.parse(data))
            resolve(respJSON1.data)
          }
          resolve()
        })
      }).on('error', (err) => {
        reject(JSON.parse(err))
      })

      req.end()
    })
  }

  getOauth() {
    const oauthinfo = {}
    oauthinfo.client_id = this.clientId
    oauthinfo.client_secret = this.clientSecret
    oauthinfo.refresh_token = this.refreshToken
    oauthinfo.grant_type = 'refresh_token'

    const encodedParams = querystring.stringify(oauthinfo)
    const options = {
      host: accountsURI,
      path: '/oauth/v2/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Analytics NodeJS Client v' + clientVersion,
        'Content-Length': encodedParams.length
      },
      method: 'POST',
      secureProtocol: 'TLSv1_2_method'
    }

    return new Promise(function (resolve, reject) {
      const req = https.request(options, (resp) => {
        let data = ''
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
          data += chunk
        })

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          const respJSON = (JSON.parse(data))

          if (!respJSON.error) {
            // console.log(respJSON.access_token);
            resolve(respJSON.access_token)
          } else {
            const err = {}
            err.errorCode = '0'
            err.errorMessage = respJSON.error
            reject(err)
          }
        })
      }).on('error', (err) => {
        reject(err.message)
      })
      req.write(encodedParams)
      req.end()
    })
  }
};

class OrgAPI {
  constructor(ac, orgId) {
    this.ac = ac
    this.header = {}
    this.header['ZANALYTICS-ORGID'] = orgId
  }

  /**
     * Create a blank workspace in the specified organization.
     * @method createWorkspace
     * @param {String} workspaceName - Name of the workspace.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Created workspace id.
     * @throws {Error} If the request failed due to some error.
     */
  async createWorkspace(workspaceName, config = {}) {
    const uriPath = '/restapi/v2/workspaces'
    config.workspaceName = workspaceName
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result.workspaceId
  }

  /**
     * Returns list of admins for a specified organization.
     * @method getAdmins
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {JSONArray} Organization admin list.
     * @throws {Error} If the request failed due to some error.
     */
  async getAdmins(config = {}) {
    const uriPath = '/restapi/v2/orgadmins'
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.orgAdmins
  }

  /**
     * Returns subscription details of the specified organization.
     * @method getSubscriptionDetails
     * @returns {Object} Subscription details.
     * @throws {Error} If the request failed due to some error.
     */
  async getSubscriptionDetails() {
    const uriPath = '/restapi/v2/subscription'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.subscription
  }

  /**
     * Returns list of users for the specified organization.
     * @method getUsers
     * @returns {JSONArray} User list.
     * @throws {Error} If the request failed due to some error.
     */
  async getUsers() {
    const uriPath = '/restapi/v2/users'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.users
  }

  /**
     * Add users to the specified organization.
     * @method addUsers
     * @param {JSONArray} emailIds - The email address of the users to be added.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async addUsers(emailIds, config = {}) {
    const uriPath = '/restapi/v2/users'
    config.emailIds = emailIds
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Remove users from the specified organization.
     * @method removeUsers
     * @param {JSONArray} emailIds - The email address of the users to be removed.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async removeUsers(emailIds, config = {}) {
    const uriPath = '/restapi/v2/users'
    config.emailIds = emailIds
    await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
  }

  /**
     * Activate users in the specified organization.
     * @method activateUsers
     * @param {JSONArray} emailIds - The email address of the users to be activated.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async activateUsers(emailIds, config = {}) {
    const uriPath = '/restapi/v2/users/active'
    config.emailIds = emailIds
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Deactivate users in the specified organization.
     * @method deActivateUsers
     * @param {JSONArray} emailIds - The email address of the users to be deactivated.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async deActivateUsers(emailIds, config = {}) {
    const uriPath = '/restapi/v2/users/inactive'
    config.emailIds = emailIds
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Change role for the specified users.
     * @method changeUserRole
     * @param {JSONArray} emailIds - The email address of the users.
     * @param {String} role - New role for the users.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async changeUserRole(emailIds, role, config = {}) {
    const uriPath = '/restapi/v2/users/role'
    config.emailIds = emailIds
    config.role = role
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Returns details of the specified workspace/view.
     * @method getMetaDetails
     * @param {String} workspaceName - Name of the workspace.
     * @param {String} viewName - Name of the view. Can be null.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {Object} Workspace (or) View meta details.
     * @throws {Error} If the request failed due to some error.
     */
  async getMetaDetails(workspaceName, viewName = null, config = {}) {
    const uriPath = '/restapi/v2/metadetails'
    config.workspaceName = workspaceName
    if (viewName !== null) {
      config.viewName = viewName
    }

    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result
  }
}

class WorkspaceAPI {
  constructor(ac, orgId, workspaceId) {
    this.ac = ac
    this.uriPath = '/restapi/v2/workspaces/' + workspaceId
    this.header = {}
    this.header['ZANALYTICS-ORGID'] = orgId
    this.orgId = orgId
  }

  /**
     * Copy the specified workspace from one organization to another or within the organization.
     * @method copy
     * @param {String} workspaceName - Name of the new workspace.
     * @param {Object} config={} - Contains any additional control attributes.
     * @param {String} destOrgId=null - Id of the organization where the destination workspace is present.
     * @returns {String} Copied workspace id.
     * @throws {Error} If the request failed due to some error.
     */
  async copy(workspaceName, config = {}, destOrgId = null) {
    config.newWorkspaceName = workspaceName
    const reqHeader = this.header
    if (destOrgId != null) {
      reqHeader['ZANALYTICS-DEST-ORGID'] = destOrgId
    }
    const result = await this.ac.handleV2Request(this.uriPath, 'POST', config, reqHeader)
    return result.workspaceId
  }

  /**
     * Rename a specified workspace in the organization.
     * @method rename
     * @param {String} workspaceName - New name for the workspace.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async rename(workspaceName, config = {}) {
    config.workspaceName = workspaceName
    await this.ac.handleV2Request(this.uriPath, 'PUT', config, this.header)
  }

  /**
     * Delete a specified workspace in the organization.
     * @method delete
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async delete(config = {}) {
    await this.ac.handleV2Request(this.uriPath, 'DELETE', config, this.header)
  }

  /**
     * Create a table in the specified workspace.
     * @method createTable
     * @param {Object} tableDesign - Table structure.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} created table id.
     * @throws {Error} If the request failed due to some error.
     */
  async createTable(tableDesign, config = {}) {
    const uriPath = this.uriPath + '/tables'
    config.tableDesign = tableDesign
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result.viewId
  }

  /**
     * Returns the secret key of the specified workspace.
     * @method getSecretKey
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Workspace secret key.
     * @throws {Error} If the request failed due to some error.
     */
  async getSecretKey(config = {}) {
    const uriPath = this.uriPath + '/secretkey'
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.workspaceKey
  }

  /**
     * Adds a specified workspace as favorite.
     * @method addFavorite
     * @throws {Error} If the request failed due to some error.
     */
  async addFavorite(config = {}) {
    const uriPath = this.uriPath + '/favorite'
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Remove a specified workspace from favorite.
     * @method removeFavorite
     * @throws {Error} If the request failed due to some error.
     */
  async removeFavorite(config = {}) {
    const uriPath = this.uriPath + '/favorite'
    await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
  }

  /**
     * Adds a specified workspace as default.
     * @method addDefault
     * @throws {Error} If the request failed due to some error.
     */
  async addDefault(config = {}) {
    const uriPath = this.uriPath + '/default'
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Remove a specified workspace from default.
     * @method removeDefault
     * @throws {Error} If the request failed due to some error.
     */
  async removeDefault(config = {}) {
    const uriPath = this.uriPath + '/default'
    await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
  }

  /**
     * Returns list of admins for the specified workspace.
     * @method getAdmins
     * @returns {JSONArray} Workspace admin list.
     * @throws {Error} If the request failed due to some error.
     */
  async getAdmins(config = {}) {
    const uriPath = this.uriPath + '/admins'
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.workspaceAdmins
  }

  /**
     * Add admins for the specified workspace.
     * @method addAdmins
     * @param {JSONArray} emailIds - The email address of the admin users to be added.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async addAdmins(emailIds, config = {}) {
    const uriPath = this.uriPath + '/admins'
    config.emailIds = emailIds

    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Remove admins from the specified workspace.
     * @method removeAdmins
     * @param {JSONArray} emailIds - The email address of the admin users to be removed.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async removeAdmins(emailIds, config = {}) {
    const uriPath = this.uriPath + '/admins'
    config.emailIds = emailIds

    await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
  }

  /**
     * Returns shared details of the specified workspace.
     * @method getShareInfo
     * @returns {Object} Workspace share info.
     * @throws {Error} If the request failed due to some error.
     */
  async getShareInfo() {
    const uriPath = this.uriPath + '/share'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result
  }

  /**
     * Share views to the specified users.
     * @method shareViews
     * @param {JSONArray} viewIds - View ids which to be shared.
     * @param {JSONArray} emailIds - The email address of the users to whom the views need to be shared.
     * @param {Object} permissions - Contains permission details.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async shareViews(viewIds, emailIds, permissions, config = {}) {
    const uriPath = this.uriPath + '/share'
    config.viewIds = viewIds
    config.emailIds = emailIds
    config.permissions = permissions
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Remove shared views for the specified users.
     * @method removeShare
     * @param {JSONArray} viewIds - View ids whose sharing needs to be removed.
     * @param {JSONArray} emailIds - The email address of the users to whom the sharing need to be removed.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async removeShare(viewIds, emailIds, config = {}) {
    const uriPath = this.uriPath + '/share'
    if (viewIds != null) {
      config.viewIds = viewIds
    }
    config.emailIds = emailIds

    await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
  }

  /**
     * Returns list of all accessible folders for the specified workspace.
     * @method getFolders
     * @returns {JSONArray} Folder list.
     * @throws {Error} If the request failed due to some error.
     */
  async getFolders() {
    const uriPath = this.uriPath + '/folders'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.folders
  }

  /**
     * Create a folder in the specified workspace.
     * @method createFolder
     * @param {String} folderName - Name of the folder to be created.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Created folder id.
     * @throws {Error} If the request failed due to some error.
     */
  async createFolder(folderName, config = {}) {
    const uriPath = this.uriPath + '/folders'
    config.folderName = folderName
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result.folderId
  }

  /**
     * Returns list of all accessible views for the specified workspace.
     * @method getViews
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {JSONArray} View list.
     * @throws {Error} If the request failed due to some error.
     */
  async getViews(config = {}) {
    const uriPath = this.uriPath + '/views'
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.views
  }

  /**
     * Copy the specified views from one workspace to another workspace.
     * @method copyViews
     * @param {JSONArray} viewIds - The id of the views to be copied.
     * @param {String} destWorkspaceId - The destination workspace id.
     * @param {Object} config={} - Contains any additional control attributes.
     * @param {String} destOrgId=null - Id of the organization where the destination workspace is present.
     * @returns {JSONArray} View list.
     * @throws {Error} If the request failed due to some error.
     */
  async copyViews(viewIds, destWorkspaceId, config = {}, destOrgId = null) {
    const uriPath = this.uriPath + '/views/copy'
    config.viewIds = viewIds
    config.destWorkspaceId = destWorkspaceId
    const reqHeader = this.header
    if (destOrgId != null) {
      reqHeader['ZANALYTICS-DEST-ORGID'] = destOrgId
    }
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, reqHeader)
    return result.views
  }

  /**
     * Enable workspace to the specified white label domain.
     * @method enableDomainAccess
     * @throws {Error} If the request failed due to some error.
     */
  async enableDomainAccess() {
    const uriPath = this.uriPath + '/wlaccess'
    await this.ac.handleV2Request(uriPath, 'POST', null, this.header)
  }

  /**
     * Disable workspace from the specified white label domain.
     * @method disableDomainAccess
     * @throws {Error} If the request failed due to some error.
     */
  async disableDomainAccess() {
    const uriPath = this.uriPath + '/wlaccess'
    await this.ac.handleV2Request(uriPath, 'DELETE', null, this.header)
  }

  /**
     * Rename a specified folder in the workspace.
     * @method renameFolder
     * @param {String} folderId - Id of the folder.
     * @param {String} folderName - New name for the folder.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async renameFolder(folderId, newFolderName, config = {}) {
    config.folderName = newFolderName
    const uriPath = this.uriPath + '/folders/' + folderId
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Delete a specified folder in the workspace.
     * @method deleteFolder
     * @param {String} folderId - Id of the folder to be deleted.
     * @throws {Error} If the request failed due to some error.
     */
  async deleteFolder(folderId) {
    const uriPath = this.uriPath + '/folders/' + folderId
    await this.ac.handleV2Request(uriPath, 'DELETE', null, this.header)
  }

  /**
     * Returns list of groups for the specified workspace.
     * @method getGroups
     * @returns {JSONArray} Group list.
     * @throws {Error} If the request failed due to some error.
     */
  async getGroups() {
    const uriPath = this.uriPath + '/groups'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.groups
  }

  /**
     * Get the details of the specified group.
     * @method getGroupDetails
     * @param {String} groupId - Id of the group.
     * @returns {Object} Details of the specified group.
     * @throws {Error} If the request failed due to some error.
     */
  async getGroupDetails(groupId) {
    const uriPath = this.uriPath + '/groups/' + groupId
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.groups
  }

  /**
     * Create a group in the specified workspace.
     * @method createGroup
     * @param {String} groupName - Name of the group.
     * @param {JSONArray} emailIds - The email address of the users to be added to the group.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Created group id.
     * @throws {Error} If the request failed due to some error.
     */
  async createGroup(groupName, emailIds, config = {}) {
    const uriPath = this.uriPath + '/groups'

    config.groupName = groupName
    config.emailIds = emailIds
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result.groupId
  }

  /**
     * Rename a specified group.
     * @method renameGroup
     * @param {String} groupId - Id of the group.
     * @param {String} newGroupName - New name for the group.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async renameGroup(groupId, newGroupName, config = {}) {
    config.groupName = newGroupName
    const uriPath = this.uriPath + '/groups/' + groupId
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Add users to the specified group.
     * @method addGroupMembers
     * @param {String} groupId - Id of the group.
     * @param {JSONArray} emailIds - The email address of the users to be added to the group.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async addGroupMembers(groupId, emailIds, config = {}) {
    config.emailIds = emailIds
    const uriPath = this.uriPath + '/groups/' + groupId + '/members'
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Remove users from the specified group.
     * @method removeGroupMembers
     * @param {String} groupId - Id of the group.
     * @param {JSONArray} emailIds - The email address of the users to be removed from the group.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async removeGroupMembers(groupId, emailIds, config = {}) {
    config.emailIds = emailIds
    const uriPath = this.uriPath + '/groups/' + groupId + '/members'
    await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
  }

  /**
     * Delete a specified group.
     * @method deleteGroup
     * @param {String} groupId - The id of the group.
     * @throws {Error} If the request failed due to some error.
     */
  async deleteGroup(groupId) {
    const uriPath = this.uriPath + '/groups/' + groupId
    await this.ac.handleV2Request(uriPath, 'DELETE', null, this.header)
  }

  /**
     * Create a slideshow in the specified workspace.
     * @method createSlideshow
     * @param {String} slideName - Name of the slideshow to be created.
     * @param {JSONArray} viewIds - Ids of the view to be included in the slideshow.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Id of the created slideshow.
     * @throws {Error} If the request failed due to some error.
     */
  async createSlideshow(slideName, viewIds, config = {}) {
    const uriPath = this.uriPath + '/slides'
    config.slideName = slideName
    config.viewIds = viewIds
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result.slideId
  }

  /**
     * Update details of the specified slideshow.
     * @method updateSlideshow
     * @param {String} slideId - The id of the slideshow.
     * @param {Object} config={} - Contains the control configurations
     * @throws {Error} If the request failed due to some error.
     */
  async updateSlideshow(slideId, config = {}) {
    const uriPath = this.uriPath + '/slides/' + slideId
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Delete a specified slideshow in the workspace.
     * @method deleteSlideshow
     * @param {String} slideId - Id of the slideshow.
     * @throws {Error} If the request failed due to some error.
     */
  async deleteSlideshow(slideId) {
    const uriPath = this.uriPath + '/slides/' + slideId
    await this.ac.handleV2Request(uriPath, 'DELETE', null, this.header)
  }

  /**
     * Returns list of slideshows for the specified workspace.
     * @method getSlideshows
     * @returns {JSONArray} Slideshow list.
     * @throws {Error} If the request failed due to some error.
     */
  async getSlideshows() {
    const uriPath = this.uriPath + '/slides'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.slideshows
  }

  /**
     * Returns slide URL to access the specified slideshow.
     * @method getSlideshowUrl
     * @param {String} slideId - Id of the slideshow.
     * @param {Object} config={} - Contains the control configurations
     * @returns {String} Slideshow URL.
     * @throws {Error} If the request failed due to some error.
     */
  async getSlideshowUrl(slideId, config = {}) {
    const uriPath = this.uriPath + '/slides/' + slideId + '/publish'
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.slideUrl
  }

  /**
     * Returns details of the specified slideshow.
     * @method getSlideshowDetails
     * @param {String} slideId - Id of the slideshow.
     * @returns {Object} Slideshow details.
     * @throws {Error} If the request failed due to some error.
     */
  async getSlideshowDetails(slideId) {
    const uriPath = this.uriPath + '/slides/' + slideId
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.slideInfo
  }

  /**
     * Create a variable in the workspace.
     * @method createVariable
     * @param {String} variableName - Name of the variable to be created.
     * @param {Number} variableName - Datatype of the variable to be created.
     * @param {Number} variableName - Type of the variable to be created.
     * @param {Object} config={} - Contains the control attributes.
     * @returns {String} Id of the created variable.
     * @throws {Error} If the request failed due to some error.
     */
  async createVariable(variableName, variableDataType, variableType, config = {}) {
    const uriPath = this.uriPath + '/variables'
    config.variableName = variableName
    config.variableDataType = variableDataType
    config.variableType = variableType
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result.variableId
  }

  /**
     * Update details of the specified variable in the workspace.
     * @method updateVariable
     * @param {String} variableId - Id of the variable.
     * @param {String} variableName - New name for the variable.
     * @param {Number} variableName - New datatype for the variable.
     * @param {Number} variableName - New type for the variable.
     * @param {Object} config={} - Contains the control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async updateVariable(variableId, variableName, variableDataType, variableType, config = {}) {
    const uriPath = this.uriPath + '/variables/' + variableId
    config.variableName = variableName
    config.variableDataType = variableDataType
    config.variableType = variableType
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Delete a specified variable in the workspace.
     * @method deleteVariable
     * @param {String} variableId - Id of the variable.
     * @throws {Error} If the request failed due to some error.
     */
  async deleteVariable(variableId) {
    const uriPath = this.uriPath + '/variables/' + variableId
    await this.ac.handleV2Request(uriPath, 'DELETE', null, this.header)
  }

  /**
     * Returns list of variables for the specified workspace.
     * @method getVariables
     * @returns {JSONArray} Variable list.
     * @throws {Error} If the request failed due to some error.
     */
  async getVariables() {
    const uriPath = this.uriPath + '/variables'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.variables
  }

  /**
     * Returns details of the specified variable.
     * @method getVariableDetails
     * @param {String} variableId - Id of the variable.
     * @returns {Object} Variable details.
     * @throws {Error} If the request failed due to some error.
     */
  async getVariableDetails(variableId) {
    const uriPath = this.uriPath + '/variables/' + variableId
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result
  }

  /**
     * Make the specified folder as default.
     * @method makeDefaultFolder
     * @param {String} folderId - Id of the folder.
     * @throws {Error} If the request failed due to some error.
     */
  async makeDefaultFolder(folderId) {
    const uriPath = this.uriPath + '/folders/' + folderId + '/default'
    await this.ac.handleV2Request(uriPath, 'PUT', null, this.header)
  }

  /**
     *Returns list of datasources for the specified workspace.
     * @method getDatasources
     * @returns {JSONArray} Datasource list.
     * @throws {Error} If the request failed due to some error.
     */
  async getDatasources() {
    const uriPath = this.uriPath + '/datasources'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.dataSources
  }

  /**
     * Initiate data sync for the specified datasource.
     * @method syncData
     * @param {String} datasourceId - Id of the datasource.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async syncData(datasourceId, config = {}) {
    const uriPath = this.uriPath + '/datasources/' + datasourceId + '/sync'
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Update connection details for the specified datasource.
     * @method updateDatasourceConnection
     * @param {String} datasourceId - Id of the datasource.
     * @param {Object} config={} - Contains the control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async updateDatasourceConnection(datasourceId, config = {}) {
    const uriPath = this.uriPath + '/datasources/' + datasourceId
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }
}

class ViewAPI {
  constructor(ac, orgId, workspaceId, viewId) {
    this.ac = ac
    this.uriPath = '/restapi/v2/workspaces/' + workspaceId + '/views/' + viewId
    this.header = {}
    this.header['ZANALYTICS-ORGID'] = orgId
  }

  /**
     * Rename a specified view in the workspace.
     * @method rename
     * @param {String} viewName - New name of the view.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async rename(viewName, config = {}) {
    config.viewName = viewName
    await this.ac.handleV2Request(this.uriPath, 'PUT', config, this.header)
  }

  /**
     * Delete a specified view in the workspace.
     * @method delete
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async delete(config = {}) {
    await this.ac.handleV2Request(this.uriPath, 'DELETE', config, this.header)
  }

  /**
     * Copy a specified view within the workspace.
     * @method saveAs
     * @param {String} newViewName - The name of the new view.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Newly created view id.
     * @throws {Error} If the request failed due to some error.
     */
  async saveAs(newViewName, config = {}) {
    const uriPath = this.uriPath + '/saveas'
    config.viewName = newViewName
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result.viewId
  }

  /**
     * Copy the specified formulas from one table to another within the workspace or across workspaces.
     * @method copyFormulas
     * @param {JSONArray} formulaNames - The name of the formula columns to be copied.
     * @param {String} destWorkspaceId - The ID of the destination workspace.
     * @param {Object} config={} - Contains any additional control attributes.
     * @param {String} destOrgId=null - Id of the organization where the destination workspace is present.
     * @throws {Error} If the request failed due to some error.
     */
  async copyFormulas(formulaNames, destWorkspaceId, config = {}, destOrgId = null) {
    const uriPath = this.uriPath + '/formulas/copy'
    config.formulaColumnNames = formulaNames
    config.destWorkspaceId = destWorkspaceId
    const reqHeader = this.header
    if (destOrgId != null) {
      reqHeader['ZANALYTICS-DEST-ORGID'] = destOrgId
    }
    await this.ac.handleV2Request(uriPath, 'POST', config, reqHeader)
  }

  /**
     * Adds a specified view as favorite.
     * @method addFavorite
     * @throws {Error} If the request failed due to some error.
     */
  async addFavorite(config = {}) {
    const uriPath = this.uriPath + '/favorite'
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Remove a specified view from favorite.
     * @method removeFavorite
     * @throws {Error} If the request failed due to some error.
     */
  async removeFavorite(config = {}) {
    const uriPath = this.uriPath + '/favorite'
    await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
  }

  /**
     * Create reports for the specified table based on the reference table.
     * @method createSimilarViews
     * @param {String} refViewId - The ID of the reference view.
     * @param {String} folderId - The folder id where the views to be saved.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async createSimilarViews(refViewId, folderId, config = {}) {
    const uriPath = this.uriPath + '/similarviews'
    config.referenceViewId = refViewId
    config.folderId = folderId
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Auto generate reports for the specified table.
     * @method autoAnalyse
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async autoAnalyse(config = {}) {
    const uriPath = this.uriPath + '/autoanalyse'
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Returns permissions for the specified view.
     * @method removeShare
     * @returns {Object} Permission details.
     * @throws {Error} If the request failed due to some error.
     */
  async getMyPermissions() {
    const uriPath = this.uriPath + '/share/mypermissions'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result.permissions
  }

  /**
     * Returns the URL to access the specified view.
     * @method getViewUrl
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} View URL.
     * @throws {Error} If the request failed due to some error.
     */
  async getViewUrl(config = {}) {
    const uriPath = this.uriPath + '/publish'
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.viewUrl
  }

  /**
     * Returns embed URL to access the specified view.
     * @method getEmbedUrl
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Embed URL.
     * @throws {Error} If the request failed due to some error.
     */
  async getEmbedUrl(config = {}) {
    const uriPath = this.uriPath + '/publish/embed'
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.embedUrl
  }

  /**
     * Returns private URL to access the specified view.
     * @method getPrivateUrl
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Private URL.
     * @throws {Error} If the request failed due to some error.
     */
  async getPrivateUrl(config = {}) {
    const uriPath = this.uriPath + '/publish/privatelink'
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.privateUrl
  }

  /**
     * Create a private URL for the specified view.
     * @method createPrivateUrl
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Private URL.
     * @throws {Error} If the request failed due to some error.
     */
  async createPrivateUrl(config = {}) {
    const uriPath = this.uriPath + '/publish/privatelink'
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result.privateUrl
  }

  /**
     * Add a column in the specified table.
     * @method addColumn
     * @param {String} columnName - The name of the column.
     * @param {String} dataType - The data-type of the column.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {String} Created column id.
     * @throws {Error} If the request failed due to some error.
     */
  async addColumn(columnName, dataType, config = {}) {
    const uriPath = this.uriPath + '/columns'
    config.columnName = columnName
    config.dataType = dataType
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result.columnId
  }

  /**
     * Hide the specified columns in the table.
     * @method hideColumns
     * @param {JSONArray} columnIds - Ids of the columns to be hidden.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async hideColumns(columnIds, config = {}) {
    const uriPath = this.uriPath + '/columns/hide'
    config.columnIds = columnIds
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Show the specified hidden columns in the table.
     * @method showColumns
     * @param {JSONArray} columnIds - Ids of the columns to be shown.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async showColumns(columnIds, config = {}) {
    const uriPath = this.uriPath + '/columns/show'
    config.columnIds = columnIds
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Add a single row in the specified table.
     * @method addRow
     * @param {Object} columnValues - Contains the values for the row. The column names are the key.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {Object} Column Names and Added Row Values.
     * @throws {Error} If the request failed due to some error.
     */
  async addRow(columnValues, config = {}) {
    const uriPath = this.uriPath + '/rows'
    config.columns = columnValues
    const result = await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
    return result
  }

  /**
     * Update rows in the specified table.
     * @method updateRow
     * @param {Object} columnValues - Contains the values for the row. The column names are the key.
     * @param {String} criteria - The criteria to be applied for updating data. Only rows matching the criteria will be updated. Should be null for update all rows.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {Object} Updated Columns List and Updated Rows Count.
     * @throws {Error} If the request failed due to some error.
     */
  async updateRow(columnValues, criteria, config = {}) {
    const uriPath = this.uriPath + '/rows'
    config.columns = columnValues
    if (criteria != null && criteria.length > 0) {
      config.criteria = criteria
    }

    const result = await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
    return result
  }

  /**
     * Delete rows in the specified table.
     * @method deleteRow
     * @param {String} criteria - The criteria to be applied for deleting data. Only rows matching the criteria will be deleted. Should be null for delete all rows.
     * @param {Object} config={} - Contains any additional control attributes.
     * @returns {int} Deleted rows count.
     * @throws {Error} If the request failed due to some error.
     */
  async deleteRow(criteria, config = {}) {
    const uriPath = this.uriPath + '/rows'
    if (criteria != null && criteria.length > 0) {
      config.criteria = criteria
    }

    const result = await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
    return result.deletedRows
  }

  /**
     * Rename a specified column in the table.
     * @method renameColumn
     * @param {String} columnId - Id of the column.
     * @param {String} newColumnName - New name for the column.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async renameColumn(columnId, newColumnName, config = {}) {
    const uriPath = this.uriPath + '/columns/' + columnId
    config.columnName = newColumnName
    await this.ac.handleV2Request(uriPath, 'PUT', config, this.header)
  }

  /**
     * Delete a specified column in the table.
     * @method deleteColumn
     * @param {String} columnId - Id of the column.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async deleteColumn(columnId, config = {}) {
    const uriPath = this.uriPath + '/columns/' + columnId
    await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
  }

  /**
     * Add a lookup in the specified child table.
     * @method addLookup
     * @param {String} columnId - Id of the column.
     * @param {String} refViewId - The id of the table contains the parent column.
     * @param {String} refColumnId - The id of the parent column.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async addLookup(columnId, refViewId, refColumnId, config = {}) {
    const uriPath = this.uriPath + '/columns/' + columnId + '/lookup'
    config.referenceViewId = refViewId
    config.referenceColumnId = refColumnId
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Remove the lookup for the specified column in the table.
     * @method removeLookup
     * @param {String} columnId - Id of the column.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async removeLookup(columnId, config = {}) {
    const uriPath = this.uriPath + '/columns/' + columnId + '/lookup'
    await this.ac.handleV2Request(uriPath, 'DELETE', config, this.header)
  }

  /**
     * Auto generate reports for the specified column.
     * @method autoAnalyseColumn
     * @param {String} columnId - Id of the column.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async autoAnalyseColumn(columnId, config = {}) {
    const uriPath = this.uriPath + '/columns/' + columnId + '/autoanalyse'
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Sync data from available datasource for the specified view.
     * @method refetchData
     * @param {String} viewName - New name of the view.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async refetchData(config = {}) {
    const uriPath = this.uriPath + '/sync'
    await this.ac.handleV2Request(uriPath, 'POST', config, this.header)
  }

  /**
     * Returns last import details of the specified view.
     * @method getLastImportDetails
     * @returns {int} Last import details.
     * @throws {Error} If the request failed due to some error.
     */
  async getLastImportDetails() {
    const uriPath = this.uriPath + '/importdetails'
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result
  }
}

class BulkAPI {
  constructor(ac, orgId, workspaceId) {
    this.ac = ac
    this.uriPath = '/restapi/v2/workspaces/' + workspaceId
    this.bulkUriPath = '/restapi/v2/bulk/workspaces/' + workspaceId
    this.header = {}
    this.header['ZANALYTICS-ORGID'] = orgId
  }

  /**
     * Create a new table and import the data contained in the mentioned file into the created table.
     * @method importDataInNewTable
     * @param {String} tableName - Name of the new table to be created.
     * @param {String} fileType - Type of the file to be imported.
     * @param {String} autoIdentify - Used to specify whether to auto identify the CSV format. Allowable values - true/false.
     * @param {String} filePath - Path of the file to be imported.
     * @param {Object} config={} - Contains any additional control attributes.
     * @return {JSONObject} Import result.
     * @throws {Error} If the request failed due to some error.
     */
  async importDataInNewTable(tableName, fileType, autoIdentify, filePath, config = {}) {
    const uriPath = this.uriPath + '/data'
    config.tableName = tableName
    config.fileType = fileType
    config.autoIdentify = autoIdentify

    const result = await this.ac.handleImportRequest(uriPath, config, this.header, filePath)
    return result
  }

  /**
     * Create a new table and import the raw data provided into the created table.
     * @method importRawDataInNewTable
     * @param {String} tableName - Name of the new table to be created.
     * @param {String} fileType - Type of the file to be imported.
     * @param {String} autoIdentify - Used to specify whether to auto identify the CSV format. Allowable values - true/false.
     * @param {String} data - Raw data to be imported.
     * @param {Object} config={} - Contains any additional control attributes.
     * @return {JSONObject} Import result.
     * @throws {Error} If the request failed due to some error.
     */
  async importRawDataInNewTable(tableName, fileType, autoIdentify, data, config = {}) {
    const uriPath = this.uriPath + '/data'
    config.tableName = tableName
    config.fileType = fileType
    config.autoIdentify = autoIdentify

    const result = await this.ac.handleImportRequest(uriPath, config, this.header, null, data)
    return result
  }

  /**
     * Import the data contained in the mentioned file into the table.
     * @method importData
     * @param {String} viewId - Id of the view where the data to be imported.
     * @param {String} importType - The type of import. Can be one of - append, truncateadd, updateadd.
     * @param {String} fileType - Type of the file to be imported.
     * @param {String} autoIdentify - Used to specify whether to auto identify the CSV format. Allowable values - true/false.
     * @param {String} filePath - Path of the file to be imported.
     * @param {Object} config={} - Contains any additional control attributes.
     * @return {JSONObject} Import result.
     * @throws {Error} If the request failed due to some error.
     */
  async importData(viewId, importType, fileType, autoIdentify, filePath, config = {}) {
    const uriPath = this.uriPath + '/views/' + viewId + '/data'
    config.importType = importType
    config.fileType = fileType
    config.autoIdentify = autoIdentify

    const result = await this.ac.handleImportRequest(uriPath, config, this.header, filePath)
    return result
  }

  /**
     * Import the raw data provided into the table.
     * @method importRawData
     * @param {String} viewId - Id of the view where the data to be imported.
     * @param {String} importType - The type of import. Can be one of - append, truncateadd, updateadd.
     * @param {String} fileType - Type of the file to be imported.
     * @param {String} autoIdentify - Used to specify whether to auto identify the CSV format. Allowable values - true/false.
     * @param {String} data - Raw data to be imported.
     * @param {Object} config={} - Contains any additional control attributes.
     * @return {JSONObject} Import result.
     * @throws {Error} If the request failed due to some error.
     */
  async importRawData(viewId, importType, fileType, autoIdentify, data, config = {}) {
    const uriPath = this.uriPath + '/views/' + viewId + '/data'
    config.importType = importType
    config.fileType = fileType
    config.autoIdentify = autoIdentify

    const result = await this.ac.handleImportRequest(uriPath, config, this.header, null, data)
    return result
  }

  /**
     * Asynchronously create a new table and import the data contained in the mentioned file into the created table.
     * @method importBulkDataInNewTable
     * @param {String} tableName - Name of the new table to be created.
     * @param {String} fileType - Type of the file to be imported.
     * @param {String} autoIdentify - Used to specify whether to auto identify the CSV format. Allowable values - true/false.
     * @param {String} filePath - Path of the file to be imported.
     * @param {Object} config={} - Contains any additional control attributes.
     * @return {String} Import job id.
     * @throws {Error} If the request failed due to some error.
     */
  async importBulkDataInNewTable(tableName, fileType, autoIdentify, filePath, config = {}) {
    const uriPath = this.bulkUriPath + '/data'
    config.tableName = tableName
    config.fileType = fileType
    config.autoIdentify = autoIdentify

    const result = await this.ac.handleImportRequest(uriPath, config, this.header, filePath)
    return result.jobId
  }

  /**
     * Asynchronously import the data contained in the mentioned file into the table.
     * @method importBulkData
     * @param {String} viewId - Id of the view where the data to be imported.
     * @param {String} importType - The type of import. Can be one of - append, truncateadd, updateadd.
     * @param {String} fileType - Type of the file to be imported.
     * @param {String} autoIdentify - Used to specify whether to auto identify the CSV format. Allowable values - true/false.
     * @param {String} filePath - Path of the file to be imported.
     * @param {Object} config={} - Contains any additional control attributes.
     * @return {String} Import job id.
     * @throws {Error} If the request failed due to some error.
     */
  async importBulkData(viewId, importType, fileType, autoIdentify, filePath, config = {}) {
    const uriPath = this.bulkUriPath + '/views/' + viewId + '/data'
    config.importType = importType
    config.fileType = fileType
    config.autoIdentify = autoIdentify

    const result = await this.ac.handleImportRequest(uriPath, config, this.header, filePath)
    return result.jobId
  }

  /**
     * Returns the details of the import job.
     * @method getImportJobDetails
     * @param {String} jobId - Id of the job.
     * @return {JSONObject} Import job details.
     * @throws {Error} If the request failed due to some error.
     */
  async getImportJobDetails(jobId) {
    const uriPath = this.bulkUriPath + '/importjobs/' + jobId
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result
  }

  /**
     * Export the mentioned table (or) view data.
     * @method exportData
     * @param {String} viewId - Id of the view to be exported.
     * @param {String} responseFormat - The format in which the data is to be exported.
     * @param {String} filePath - Path of the file where the data exported to be stored.
     * @param {Object} config={} - Contains any additional control attributes.
     * @throws {Error} If the request failed due to some error.
     */
  async exportData(viewId, responseFormat, filePath, config = {}) {
    const uriPath = this.uriPath + '/views/' + viewId + '/data'
    config.responseFormat = responseFormat
    await this.ac.handleExportRequest(uriPath, filePath, config, this.header)
  }

  /**
     * Initiate asynchronous export for the mentioned table (or) view data.
     * @method initiateBulkExport
     * @param {String} viewId - Id of the view to be exported.
     * @param {String} responseFormat - The format in which the data is to be exported.
     * @param {Object} config={} - Contains any additional control attributes.
     * @return {String} Export job id.
     * @throws {Error} If the request failed due to some error.
     */
  async initiateBulkExport(viewId, responseFormat, config = {}) {
    const uriPath = this.bulkUriPath + '/views/' + viewId + '/data'
    config.responseFormat = responseFormat
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.jobId
  }

  /**
     * Initiate asynchronous export with the given SQL Query.
     * @method initiateBulkExportUsingSQL
     * @param {String} sqlQuery - The SQL Query whose output is exported.
     * @param {String} responseFormat - The format in which the data is to be exported.
     * @param {Object} config={} - Contains any additional control attributes.
     * @return {String} Export job id.
     * @throws {Error} If the request failed due to some error.
     */
  async initiateBulkExportUsingSQL(sqlQuery, responseFormat, config = {}) {
    const uriPath = this.bulkUriPath + '/data'
    config.sqlQuery = sqlQuery
    config.responseFormat = responseFormat
    const result = await this.ac.handleV2Request(uriPath, 'GET', config, this.header)
    return result.jobId
  }

  /**
     * Returns the details of the export job.
     * @method getExportJobDetails
     * @param {String} jobId - Id of the export job.
     * @return {JSONObject} Export job details.
     * @throws {Error} If the request failed due to some error.
     */
  async getExportJobDetails(jobId) {
    const uriPath = this.bulkUriPath + '/exportjobs/' + jobId
    const result = await this.ac.handleV2Request(uriPath, 'GET', null, this.header)
    return result
  }

  /**
     * Download the exported data for the mentioned job id.
     * @method exportBulkData
     * @param {String} jobId - Id of the job to be exported.
     * @param {String} filePath - Path of the file where the data exported to be stored.
     * @throws {Error} If the request failed due to some error.
     */
  async exportBulkData(jobId, filePath) {
    const uriPath = this.bulkUriPath + '/exportjobs/' + jobId + '/data'
    await this.ac.handleExportRequest(uriPath, filePath, null, this.header)
  }
}

module.exports = AnalyticsClient
