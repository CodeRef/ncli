const path = require('path')
const fs = require('fs')
const chai = require('chai')
const sinon = require('sinon')
const inquirer = require('inquirer')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const dirtyChai = require('dirty-chai')
const configure = require('../../commands/configure')
const CredentialManager = require('../../lib/credential-manager')
const Twitter = require('../../lib/twitter')
const util = require('../../lib/util')
chai.use(chaiAsPromised)
chai.use(dirtyChai)

describe('the configure module', () => {
  var creds
  var sandbox
  before(() => {
    creds = new CredentialManager('ncli-test')
  })
  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })
  it('should add credential when none are found', async () => {
    sandbox.stub(inquirer, 'prompt').resolves({key: 'one', secret: 'two'})
    await configure.consumer('ncli-test')
    let [key, secret] = await creds.getKeyAndSecret('consumer')
    expect(key).to.equal('one')
    expect(secret).to.equal('two')
    expect(inquirer.prompt.calledOnce).to.be.true()
  })
  it('should add credential when none are found', async () => {
    sandbox.stub(inquirer, 'prompt').resolves({key: 'three', secret: 'four'})
    await configure.consumer('ncli-test')
    let [key, secret] = await creds.getKeyAndSecret('consumer')
    expect(key).to.equal('three')
    expect(secret).to.equal('four')
    expect(inquirer.prompt.calledOnce).to.be.true()
  })
  it('should add an account', async () => {
    sandbox.stub(CredentialManager.prototype, 'getKeyAndSecret')
      .resolves(['key', 'secret'])

    sandbox.stub(Twitter.prototype, 'post')
      .onFirstCall().resolves('oauth_token=abc&oauth_token_secret=def')
      .onSecondCall().resolves('oauth_token=ghi&oauth_token_secret=jkl')

    sandbox.stub(Twitter.prototype, 'get')
      .resolves({screen_name: 'foo'})

    sandbox.stub(inquirer, 'prompt')
      .onFirstCall().resolves({continue: ''})
      .onSecondCall().resolves({pin: '1234'})

    sandbox.stub(util, 'openBrowser').returns('')
    sandbox.stub(console, 'log')
    await configure.account('ncli-test')
    CredentialManager.prototype.getKeyAndSecret.restore()
    let [token, secret] = await creds.getKeyAndSecret('account')
    expect(token).to.equal('ghi')
    expect(secret).to.equal('jkl')
    expect(console.log.calledWith('Account "foo" successfully added.')).to.be.true()
  })

  afterEach(() => {
    sandbox.restore()
  })
  after(async () => {
    await creds.clearAll()
    await fs.unlink(path.join(process.env.HOME, '.config', 'configstore', 'ncli-test.json'))
  })
})
