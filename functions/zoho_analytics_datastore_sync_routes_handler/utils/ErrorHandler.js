const AppError = require('./AppError')
const AppConstants = require('../constants')

class ErrorHandler {
  processError = (err) => {
    if (err instanceof AppError) {
      return {
        status: 'failure',
        statusCode: err.statusCode,
        message: err.message
      }
    } else if (err.errorCode && err.errorMessage) {
      for (const [httpStatusCode, analyticsErrorCodes] of Object.entries(AppConstants.AnalyticsErrorCodeMap)) {
        if (analyticsErrorCodes.includes(err.errorCode)) {
          return {
            status: 'failure',
            statusCode: httpStatusCode,
            message: err.errorMessage
          }
        }
      }
    }
    console.log('Error :::', err)
    return {
      status: 'failure',
      statusCode: 500,
      message: "We're unable to process your request. Kindly check logs to know more details."
    }
  }

  static getInstance = () => {
    return new ErrorHandler()
  }
}

module.exports = ErrorHandler
