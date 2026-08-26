import {SpeechCorpus} from 'meteor/leaonline:speech-corpus'

const dynamicExtract = async ({texts, log, importerFns}) => {
    for (const fn of importerFns) {
        const loaded = await fn()
        console.log('from dynamic import', loaded?.default)
        SpeechCorpus.extract.fromI18n(loaded?.default ?? loaded, texts, console.log)
    }
}

export const createCorpusQuery = async ({format = 'json', type = 'file', path, isLegacy = false, settings = {}}) => {
    const logOut = []
    const log = (...args) => logOut.push(args.join(' '))
    const {interval = 100} = settings
    const texts = new Set()
    const title = `otulea_corpus_${Date.now()}`

    await dynamicExtract({
        texts, log, importerFns: [
            () => import('../../resources/i18n/de/i18n.json'),
            () => import('../ui/pages/unit/i18n/de.json'),
            () => import('../ui/pages/story/i18n/de.json'),
            () => import('../ui/pages/complete/i18n/de.json'),
            () => import('../ui/pages/legal/i18n/de.json'),
            () => import('../ui/pages/notfound/i18n/de.json'),
            () => import('../ui/pages/overview/i18n/de.json'),
            () => import('../ui/pages/logout/i18n/de.json'),
            () => import('../ui/pages/welcome/i18n/de.json'),
            () => import('../ui/components/fatal/i18n/de.json'),
            () => import('../ui/layout/footer/i18n/de.json'),
        ]
    })

    const data = SpeechCorpus.transformers.hashTuple({data: texts})


    // write to log
    await SpeechCorpus.build({
        data: logOut.join('\n'),
        format: 'text',
        type: 'file',
        path,
        title,
        ext: 'log'
    })
// write to file
    return SpeechCorpus.build({
        data,
        format,
        type,
        path,
        title
    })
}


const fromUnitSets = async (query, options, settings) => {
    const {log} = settings
    const UnitSetCollection = getCollection(UnitSet.name)
    const transform = toTransform(options)
    const unitSets = await UnitSetCollection.find(query, transform).fetchAsync()
    const texts = new Set()
    log(`[${UnitSet.name}]: Fetched documents: ${unitSets.length}, query=${JSON.stringify(query)}`)
    for (const unitSet of unitSets) {
        const {title, description, story} = unitSet

        if (title) texts.add(title)
        if (description) texts.add(description)
        fromContent({source: story, destination: texts, settings})
    }

    return texts
}

const fromUnits = async (query, options, settings) => {
    const {log} = settings
    const UnitCollection = getCollection(Unit.name)
    const transform = toTransform(options)

    const units = await UnitCollection.find(query, transform).fetchAsync()
    const texts = new Set()
    log(`[${Unit.name}]: Fetched documents: ${units.length}, query=${JSON.stringify(query)}`)

    for (const unit of units) {
        const {title, instructions, stimuli, pages} = unit
        if (title) texts.add(title)
        fromContent({source: instructions, destination: texts, settings})
        fromContent({source: stimuli, destination: texts, settings})
        for (const page of pages) {
            const {content} = page
            fromContent({source: content, destination: texts, settings})
        }
    }

    return texts
}

const fromContent = ({source = [], destination = new Set()}) => {
    for (const entry of source) {
        const {type, subtype, value} = entry

        if (type === 'text' && value) {
            destination.add(value)
        }

        if (type === 'item' && subtype === 'choice') {
            const {choices} = value
            for (const choice of choices) {
                if (choice.text) {
                    destination.add(choice.text)
                }
            }
        }

        if (type === 'item' && subtype === 'cloze') {
            const {text} = value
            const replaced = text.replace(/{{(.*?)}}/g, (match, p1) => {
                const parts = p1.split('$')
                if (parts.length === 3) {
                    return parts[2]?.trim() || ''
                }
                return ''
            })
            destination.add(replaced)
        }
    }

    return destination
}

const fromFields = async ({ctx, query = {}, options = {}, fields, mapping, log}) => {
    const collection = getCollection(ctx.name)
    const transform = toTransform(options)
    const docs = await collection.find(query, transform).fetchAsync()
    log(`[${ctx.name}]: Fetched documents: ${docs.length}, query=${JSON.stringify(query)}`)
    const texts = new Set()

    for (const doc of docs) {
        for (const fieldName of fields) {
            const value = doc[fieldName]

            if (value) {
                texts.add(mapping ? mapping(value) : value)
            }
        }
    }

    return texts
}
