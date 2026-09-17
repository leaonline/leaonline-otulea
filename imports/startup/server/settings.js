import { Meteor } from 'meteor/meteor'
import { Schema } from '../../api/schema/Schema'
import validateSettings from '../../../.settingsschema'

validateSettings(Schema.provider, Meteor.settings)
