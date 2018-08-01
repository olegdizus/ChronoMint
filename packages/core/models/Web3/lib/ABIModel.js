import Joi from 'joi'
import AbstractModel from '../../Core/lib/AbstractModel'

const schemaFactory = () => ({
  address: Joi.string().required(),
  isLoading: Joi.boolean().required(),
  isLoaded: Joi.boolean().required(),
  value: Joi.object().allow(null),
})

export const schema = schemaFactory()

export default class ABIModel extends AbstractModel {
  constructor (data, options) {
    super(Object.assign({
      isLoading: true,
      isLoaded: false,
      value: null,
    }, data), schemaFactory(), options)
    Object.freeze(this)
  }

  loaded (value) {
    return new ABIModel({
      ...this,
      isLoaded: true,
      isLoading: false,
      value,
    })
  }

  loading () {
    return new ABIModel({
      ...this,
      isLoading: true,
    })
  }
}
