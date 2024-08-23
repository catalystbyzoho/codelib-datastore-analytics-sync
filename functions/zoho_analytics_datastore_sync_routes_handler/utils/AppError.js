class AppError extends Error {
  statusCode = 500

  constructor (statusCode, message) {
    super()

    this.statusCode = statusCode
    this.message = message
  }
}
module.exports = AppError
