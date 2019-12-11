const chai = require('chai')
const { afterEach, beforeEach, describe, it } = require('mocha')
const employee = require('./employee')
const products = require('./products')
const pricing = require('../pricing')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.use(sinonChai)
const { expect } = chai

describe('pricing', () => {
  describe('formatPrice', () => {
    it('returns the price given, truncated to two decimal places', () => {
      const formattedPrice = pricing.formatPrice(15.335)

      expect(formattedPrice).to.equal(15.33)
    })

    it('returns the price with two decimal places when a whole number is provided', () => {
      const formattedPrice = pricing.formatPrice(15)

      expect(formattedPrice).to.equal(15.00)
    })
  })

  describe('getEmployerContribution', () => {
    it('returns the contribution amount from the product when contribution type is dollars', () => {
      const contribution = pricing.getEmployerContribution(products.longTermDisability.employerContribution, 15.33)

      expect(contribution).to.equal(10)
    })

    it('returns the calculated contribution (percent of price) when the contribution type is percentage', () => {
      const contribution = pricing.getEmployerContribution(products.voluntaryLife.employerContribution, 150)

      expect(contribution).to.equal(15)

    })
  })

  describe('calculateVolLifePricePerRole', () => {
    it('retuns the price of vol life coverage for a particular role (ee)', () => {
      const coverageLevel = [{ role: 'ee', coverage: 125000 }]

      const price = pricing.calculateVolLifePricePerRole('ee', coverageLevel, products.voluntaryLife.costs)

      expect(price).to.equal(43.75)
    })
  })

  describe('calculateVolLifePrice', () => {
    it('returns the price (pre employer contribution) of a vol life product for employee only coverage', () => {
      const selectedOptions = {
        familyMembersToCover: ['ee'],
        coverageLevel: [{ role: 'ee', coverage: 125000 }],
      }

      const price = pricing.calculateVolLifePrice(products.voluntaryLife, selectedOptions)

      expect(price).to.equal(43.75)
    })

    it('returns the price (pre employer contribution) of a vol life product for employee and spouse coverage', () => {
      const selectedOptions = {
        familyMembersToCover: ['ee', 'sp'],
        coverageLevel: [
          { role: 'ee', coverage: 200000 },
          { role: 'sp', coverage: 75000 },
        ],
      }

      const price = pricing.calculateVolLifePrice(products.voluntaryLife, selectedOptions)

      expect(price).to.equal(79)
    })
  })

  describe('calculateLTDPrice', () => {
    it('returns the price (pre employer contribution) for a LTD product for an employee', () => {
      const selectedOptions = {
        familyMembersToCover: ['ee']
      }

      const price = pricing.calculateLTDPrice(products.longTermDisability, employee, selectedOptions)

      expect(price).to.equal(32.04)
    })
  })

  describe('calculateCommuterPrice', () => {
    it('returns the price of selected commuter product without employer contribution (parking)', () => {
      const selectedOptions = {
        benefit: 'parking'
      }
      const price = pricing.calculateCommuterPrice(products.commuter, selectedOptions)
      expect(price).to.equal(250)
    })

    it('returns the price of selected commuter product without employer contribution (train)', () => {
      const selectedOptions = {
        benefit: 'train'
      }
      const price = pricing.calculateCommuterPrice(products.commuter, selectedOptions)

      expect(price).to.equal(84.75)
    })
  })

  describe('calculateProductPrice', () => {
    let sandbox

    let formatPriceSpy
    let getEmployerContributionSpy
    let calculateVolLifePricePerRoleSpy
    let calculateLTDPriceSpy
    let calculateVolLifePriceSpy
    let calculateCommuterPriceSpy

    beforeEach(() => {
      sandbox = sinon.createSandbox()

      formatPriceSpy = sandbox.spy(pricing, 'formatPrice')
      getEmployerContributionSpy = sandbox.spy(pricing, 'getEmployerContribution')
      calculateVolLifePricePerRoleSpy = sandbox.spy(pricing, 'calculateVolLifePricePerRole')
      calculateLTDPriceSpy = sandbox.spy(pricing, 'calculateLTDPrice')
      calculateVolLifePriceSpy = sandbox.spy(pricing, 'calculateVolLifePrice')
      calculateCommuterPriceSpy = sandbox.spy(pricing, 'calculateCommuterPrice')
    })

    afterEach(() => {
      sandbox.restore()
    })
    it('return the price for a voluntary life product for a single employee', () => {

      const selectedOptions = {
        familyMembersToCover: ['ee'],
        coverageLevel: [{ role: 'ee', coverage: 125000 }],
      }
      const price = pricing.calculateProductPrice(products.voluntaryLife, employee, selectedOptions)

      expect(price).to.equal(39.37)
      expect(calculateVolLifePriceSpy).to.have.callCount(1)
      expect(calculateVolLifePricePerRoleSpy).to.have.callCount(1)
      expect(getEmployerContributionSpy).to.have.callCount(1)
      expect(formatPriceSpy).to.have.callCount(1)

    })

    it('returns the price for a voluntary life product for an employee with a spouse', () => {
      const selectedOptions = {
        familyMembersToCover: ['ee', 'sp'],
        coverageLevel: [
          { role: 'ee', coverage: 200000 },
          { role: 'sp', coverage: 75000 },
        ],
      }
      const price = pricing.calculateProductPrice(products.voluntaryLife, employee, selectedOptions)

      expect(price).to.equal(71.09)
      expect(calculateVolLifePriceSpy).to.have.callCount(1)
      expect(calculateVolLifePricePerRoleSpy).to.have.callCount(2)
      expect(getEmployerContributionSpy).to.have.callCount(1)
      expect(formatPriceSpy).to.have.callCount(1)
    })

    it('returns the price for a disability product for an employee', () => {
      const selectedOptions = {
        familyMembersToCover: ['ee']
      }
      const price = pricing.calculateProductPrice(products.longTermDisability, employee, selectedOptions)

      expect(price).to.equal(22.04)
      expect(calculateLTDPriceSpy).to.have.callCount(1)
      expect(getEmployerContributionSpy).to.have.callCount(1)
      expect(formatPriceSpy).to.have.callCount(1)
    })

    it('returns the price of selected commuter product (parking)', () => {
      const selectedOptions = {
        benefit: 'parking'
      }
      const price = pricing.calculateProductPrice(products.commuter, employee, selectedOptions)
      expect(price).to.equal(175)
      expect(calculateCommuterPriceSpy).to.have.callCount(1)
      expect(getEmployerContributionSpy).to.have.callCount(1)
      expect(formatPriceSpy).to.have.callCount(1)
    })

    it('returns the price of selected commuter product (train)', () => {
      const selectedOptions = {
        benefit: 'train'
      }
      const price = pricing.calculateProductPrice(products.commuter, employee, selectedOptions)

      expect(price).to.equal(9.75)
      expect(calculateCommuterPriceSpy).to.have.callCount(1)
      expect(getEmployerContributionSpy).to.have.callCount(1)
      expect(formatPriceSpy).to.have.callCount(1)
    })

    it('throws an error on unknown product type', () => {
      const unknownProduct = { type: 'vision' }

      expect(() => pricing.calculateProductPrice(unknownProduct, {}, {})).to.throw('Unknown product type: vision')
    })
  })
})