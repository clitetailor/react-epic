import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import { JSDOM } from 'jsdom'

function configureWindow() {
  const window = new JSDOM('').window

  global.window = window
  global.document = window.document
}

function configureEnzyme() {
  Enzyme.configure({ adapter: new Adapter() })
}

function runConfigs(configs) {
  for (const config of configs) {
    config()
  }
}

runConfigs([configureWindow, configureEnzyme])
