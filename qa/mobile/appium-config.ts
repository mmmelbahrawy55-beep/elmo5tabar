import { type Config } from '@wdio/types';

const browserStackConfig = {
  user: process.env.BROWSERSTACK_USERNAME || '',
  key: process.env.BROWSERSTACK_ACCESS_KEY || '',
  services: [
    [
      'browserstack',
      {
        app: process.env.BROWSERSTACK_APP_ID || '',
        buildName: `AlMokhtabar Mobile Tests ${new Date().toISOString().split('T')[0]}`,
        projectName: 'AlMokhtabar Laboratory',
        debug: true,
        networkLogs: true,
        consoleLogs: 'warn',
        local: true,
        localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
      },
    ],
  ],
};

const sauceLabsConfig = {
  user: process.env.SAUCE_USERNAME || '',
  key: process.env.SAUCE_ACCESS_KEY || '',
  services: [
    [
      'sauce',
      {
        buildName: `AlMokhtabar Mobile Tests ${Date.now()}`,
        tunnelIdentifier: process.env.SAUCE_TUNNEL_ID,
      },
    ],
  ],
};

const config: Config = {
  runner: 'local',
  path: '/',
  specs: ['./test/specs/**/*.spec.ts'],
  exclude: [],
  maxInstances: 10,
  capabilities: [
    // iOS - iPhone 15
    {
      platformName: 'iOS',
      'appium:deviceName': 'iPhone 15',
      'appium:platformVersion': '17.0',
      'appium:automationName': 'XCUITest',
      'appium:app': process.env.IOS_APP_PATH || './apps/AlMokhtabar.app',
      'appium:autoAcceptAlerts': true,
      'appium:autoDismissAlerts': false,
      'appium:screenshotOnTestFailure': true,
      'appium:videoRecordingOnTestFailure': true,
      'appium:language': 'ar',
      'appium:locale': 'ar_SA',
      'appium:showXcodeLog': true,
      'appium:iPhoneOnly': true,
      'appium:maxTypingFrequency': 5,
      'appium:simpleIsVisibleCheck': true,
      'appium:useNewWDA': true,
      'appium:waitForQuiescence': true,
    },
    // Android - Samsung Galaxy S24
    {
      platformName: 'Android',
      'appium:deviceName': 'Samsung Galaxy S24',
      'appium:platformVersion': '14.0',
      'appium:automationName': 'UiAutomator2',
      'appium:app': process.env.ANDROID_APP_PATH || './apps/AlMokhtabar.apk',
      'appium:autoGrantPermissions': true,
      'appium:autoAcceptAlerts': true,
      'appium:isHeadless': false,
      'appium:language': 'ar',
      'appium:locale': 'ar_SA',
      'appium:appWaitActivity': 'com.almokhtabar.*',
      'appium:appWaitDuration': 30000,
      'appium:adbExecTimeout': 30000,
      'appium:androidInstallTimeout': 120000,
      'appium:uiautomator2ServerInstallTimeout': 60000,
      'appium:uiautomator2ServerLaunchTimeout': 60000,
      'appium:enablePerformanceLogging': true,
      'appium:enableNotificationListener': true,
      'appium:skipDeviceInitialization': false,
      'appium:skipUnlock': true,
      'appium:noReset': false,
      'appium:fullReset': true,
    },
    // Android - Google Pixel 8
    {
      platformName: 'Android',
      'appium:deviceName': 'Google Pixel 8',
      'appium:platformVersion': '14.0',
      'appium:automationName': 'UiAutomator2',
      'appium:app': process.env.ANDROID_APP_PATH || './apps/AlMokhtabar.apk',
      'appium:autoGrantPermissions': true,
      'appium:language': 'ar',
      'appium:locale': 'ar_SA',
    },
    // Android - Huawei P60
    {
      platformName: 'Android',
      'appium:deviceName': 'Huawei P60',
      'appium:platformVersion': '12.0',
      'appium:automationName': 'UiAutomator2',
      'appium:app': process.env.ANDROID_APP_PATH || './apps/AlMokhtabar.apk',
      'appium:autoGrantPermissions': true,
      'appium:language': 'ar',
      'appium:locale': 'ar_SA',
      'appium:gmsEnabled': false,
    },
    // iOS - iPad Pro (Tablet)
    {
      platformName: 'iOS',
      'appium:deviceName': 'iPad Pro (12.9-inch) (6th generation)',
      'appium:platformVersion': '17.0',
      'appium:automationName': 'XCUITest',
      'appium:app': process.env.IOS_APP_PATH || './apps/AlMokhtabar.app',
      'appium:autoAcceptAlerts': true,
      'appium:language': 'ar',
      'appium:locale': 'ar_SA',
    },
  ],
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: './qa/reports/allure',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
        useCucumberStepReporter: false,
      },
    ],
    [
      'json',
      {
        outputDir: './qa/reports/json',
        outputFileFormat: function (opts: any) {
          return `results-${opts.cid}.json`;
        },
      },
    ],
    ['junit', { outputDir: './qa/reports/junit' }],
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
    require: ['ts-node/register'],
  },
  screenshotOnTestFailure: true,
  videoRecordingOnTestFailure: true,
  beforeSession: function (config, capabilities, specs) {
    console.log(`Starting test session for ${capabilities.platformName} - ${capabilities['appium:deviceName']}`);
  },
  afterSession: function (config, capabilities, specs) {
    console.log(`Finished test session for ${capabilities.platformName} - ${capabilities['appium:deviceName']}`);
  },
  beforeTest: function (test, context) {
    console.log(`Starting test: ${test.title}`);
  },
  afterTest: function (test, context, { error, result, duration, passed, retries }) {
    if (error) {
      console.error(`Test failed: ${test.title}`);
      console.error(error.message);
    }
    if (test.fatal) {
      console.error(`Fatal error in test: ${test.title}`);
    }
  },
  onError: function (error) {
    console.error('Global error:', error.message);
  },
};

export { config, browserStackConfig, sauceLabsConfig };
