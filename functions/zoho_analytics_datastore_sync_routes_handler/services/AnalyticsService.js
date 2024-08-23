const { AnalyticsClient } = require('../lib')
const AppConstants = require('../constants')

class AnalyticsService {
  static getInstance = () => {
    const clientId = process.env[AppConstants.Env.ClientId]
    const clientSecret = process.env[AppConstants.Env.ClientSecret]
    const refreshToken = process.env[AppConstants.Env.RefreshToken]
    return new AnalyticsClient(clientId, clientSecret, refreshToken)
  }
}

module.exports = AnalyticsService
