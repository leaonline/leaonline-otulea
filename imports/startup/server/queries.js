import { createMethod } from "../../infrastructure/factories/method/createMethods";
import {createCorpusQuery} from "../../queries/createCorpusQuery";


if (Meteor.isDevelopment) {
    createMethod({
        name: 'query.methods.createCorpus',
        schema: {
            format: String,
            type: String,
            path: String,
            isLegacy: {
                type: Boolean,
                optional: true
            }
        },
        isPublic: true,
        run: createCorpusQuery
    })
}