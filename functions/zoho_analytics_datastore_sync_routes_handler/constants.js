class AppConstants {
  static Headers = {
    CodelibSecretKey: 'catalyst-codelib-secret-key'
  }

  static Env = {
    ClientId: 'CLIENT_ID',
    ClientSecret: 'CLIENT_SECRET',
    RefreshToken: 'REFRESH_TOKEN',
    CodelibSecretKey: 'CODELIB_SECRET_KEY',
    AuthHost: 'AUTH_HOST'
  }

  static OmittedColumn = ['CREATORID', 'CREATEDTIME', 'MODIFIEDTIME']
  static DataTypes = {
    text: 'MULTI_LINE',
    varchar: 'PLAIN',
    date: 'DATE',
    datetime: 'DATE',
    int: 'NUMBER',
    double: 'DECIMAL_NUMBER',
    boolean: 'BOOLEAN',
    bigint: 'NUMBER',
    'foreign key': 'PLAIN',
    'encrypted text': 'PLAIN'
  }

  static AnalyticsErrorCodeMap = {
    400: [7003, 7102, 7104, 7507, 7511, 8002, 8004, 8516],
    403: [7301, 8023],
    404: [7103, 7105, 7106],
    409: [7101, 7111]
  }

  static MaxRecords = 200000
  static JobName = 'Analytics'
  static CatalystComponents = {
    Segment: {
      Analytics: 'ZohoAnalyticsDatastoreSync'
    }
  }
}

module.exports = AppConstants
