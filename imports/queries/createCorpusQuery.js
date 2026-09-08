import { SpeechCorpus } from 'meteor/leaonline:speech-corpus'

const dynamicExtract = async ({ texts, log, importerFns }) => {
  for (const fn of importerFns) {
    const loaded = await fn()
    log('from dynamic import', loaded?.default)
    SpeechCorpus.extract.fromI18n(loaded?.default ?? loaded, texts, console.log)
  }
}

export const createCorpusQuery = async ({
  format = 'json',
  type = 'file',
  path,
}) => {
  const logOut = []
  const log = (...args) => logOut.push(args.join(' '))
  const texts = new Set()
  const title = `otulea_corpus_${Date.now()}`

  await dynamicExtract({
    texts,
    log,
    importerFns: [
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
    ],
  })

  const data = SpeechCorpus.transformers.hashTuple({ data: texts })

  // write to log
  await SpeechCorpus.build({
    data: logOut.join('\n'),
    format: 'text',
    type: 'file',
    path,
    title,
    ext: 'log',
  })
  // write to file
  return SpeechCorpus.build({
    data,
    format,
    type,
    path,
    title,
  })
}
