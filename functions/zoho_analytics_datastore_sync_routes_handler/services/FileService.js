const fs = require('fs')
const os = require('os')
const path = require('path')

class FileService {
  #tempDir = path.join(os.tmpdir(), 'analytics')

  constructor () {
    if (!fs.existsSync(this.#tempDir)) {
      fs.mkdirSync(this.#tempDir, {
        recursive: true
      })
    }
  }

  createTempFilePath = (fileName) => {
    return path.join(this.#tempDir, path.normalize(fileName))
  }

  getTempDirectory = () => {
    return this.#tempDir
  }

  static getInstance = () => {
    return new FileService()
  }
}

module.exports = FileService
