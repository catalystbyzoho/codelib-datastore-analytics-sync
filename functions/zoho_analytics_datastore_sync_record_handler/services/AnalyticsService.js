const { AnalyticsClient } = require('../lib')
const AppConstants = require('../constants')

class AnalyticsService {
  static getInstance = async (catalyst) => {
    const clientId = process.env[AppConstants.Env.ClientId]
    const clientSecret = process.env[AppConstants.Env.ClientSecret]
    const refreshToken = process.env[AppConstants.Env.RefreshToken]
    const credentials = {
      bulk_connector: {
        client_id: clientId,
        client_secret: clientSecret,
        auth_url: 'https://accounts.zoho.com/oauth/v2/token',
        refresh_url: 'https://accounts.zoho.com/oauth/v2/token',
        refresh_token: refreshToken,
      },
    };
    const accessToken = await catalyst.connection(credentials).getConnector("bulk_connector").getAccessToken();
    return new AnalyticsClient(clientId, clientSecret, refreshToken, accessToken)
  }
}

module.exports = AnalyticsService
