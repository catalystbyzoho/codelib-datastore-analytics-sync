const AppConstants = require('../constants')
class AuthService {
  #DefaultKey = 'CODELIB_FAKE_KEY'

  isValidRequest = (key) => {
    return key && key !== this.#DefaultKey && key === process.env[AppConstants.Env.CodelibSecretKey]
  }

  static getInstance = () => {
    return new AuthService()
  }
}
module.exports = AuthService
