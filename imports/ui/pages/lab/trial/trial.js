import {Trial} from "../../../../contexts/trial/Trial";
import {Dimension} from "../../../../contexts/Dimension";
import {Unit} from "../../../../contexts/Unit";
import {UnitSet} from "../../../../contexts/unitSet/UnitSet";
import trialLang from "./i18n/lang";
import {loadContentDoc} from "../../../loading/loadContentDoc";
import {Scoring} from '../../../../contexts/Scoring'
import {getQueryParam} from "../../../routing/getQueryParam";
import {setQueryParam} from "../../../routing/setQueryParam";
import {callMethod} from "../../../../infrastructure/methods/callMethod";
import {getColor} from "../shared/getColor";
import './trial.html'
import '../../unit/unit'
import '../../story/story'
import {initTaskRenderers} from "../../../renderers/initTaskRenderers";
import {pageCache, responseCache, submitItems} from "./cache";
import {createItemInput} from "../../unit/item/createItemInput";
import {createItemLoad} from "../../unit/item/createItemLoad";
import {submitAndAdvancePage} from "../../unit/unitBehavior";
import {createOnEvaluate} from "../shared/createOnEvaluate";
import {onPageNavUpdate} from "../../unit/unit";


// in this trial page users can test exactly ONE unitSet at a time
// which is prepending by a "START" state and
// which is followed by a "FINISHED" state

const TRIAL_VIEWS = {
    start: {name: 'start'},
    story: {name: 'story'},
    unit: {name: 'unit'},
    finish: {name: 'finish'}
}

Template.trial.onCreated(async function () {
    const instance = this

    // helpers
    instance.getView = name => TRIAL_VIEWS[name]

    // context scope
    const unitSetId = instance.data.params.unitSetId

    // fail early
    if (!unitSetId) {
        // TODO set error etc.
    }

    // get starting view state from query param, if none exists, use start
    const view = getQueryParam('step') ?? TRIAL_VIEWS.start.name
    const trialId = getQueryParam('trial')
    const unitId = getQueryParam('unit')
    const currentPageCount = getQueryParam('page') ?? 0
    instance.state.set({view})

    // general dependencies
    const { api } = instance.initDependencies({
        language: true,
        contexts: [Dimension, Unit, UnitSet, Trial],
        tts: true,
        debug: true,
        translations: trialLang,
        onComplete: () => {
            instance.state.set('dependenciesComplete', true)
        },
        onError: (e) => {
            // instance.data.onFail()
            instance.state.set('dependenciesComplete', true)
        },
    })

    // data loading dependencies
    const unitSetDoc = await loadContentDoc({
        context: UnitSet,
        from: 'remote',
        throwIfNotFound: true,
        query: {_id: unitSetId},
    })

    const dimensionDoc = await loadContentDoc({
        context: Dimension,
        from: 'remote',
        throwIfNotFound: true,
        query: {_id: unitSetDoc.dimension},
    })

    const color = await getColor({dimensionId: unitSetDoc.dimension, from: 'remote'})

    // pre-load unit
    const unitDoc = await loadContentDoc({
        context: Unit,
        from: 'remote',
        throwIfNotFound: true,
        // load step-bound unit or first one as default
        query: {_id: unitId ?? unitSetDoc.units[0]},
    })

    const trialDoc = trialId && await loadContentDoc({
        context: Trial,
        throwIfNotFound: false,
        query: {_id: trialId},
    })

    const hasStory = unitSetDoc.story?.length
    const max = unitSetDoc.progress + 1
    const initialProgress = trialDoc?.progress || 1
    const value = (initialProgress / max) * 100
    const progress = { value, count: initialProgress, rounded: Math.round(value), type: 'primary', max}
    instance.state.set({trialDoc, unitSetDoc, unitDoc, hasStory, progress, dimensionDoc, color, currentPageCount })


    instance.renderersLoaded = initTaskRenderers()

    instance.onEvaluate = createOnEvaluate({instance, storage: window.sessionStorage })

    instance.onNewPage = ({ action, newPage }, onComplete) => {
        const progress = instance.state.get('progress')
        progress.count++
        progress.value = (progress.count / progress.max) * 100
        progress.rounded = Math.round(progress.value)
        instance.state.set({ progress, loading: true, ...newPage })
        setTimeout(() => {
            instance.state.set({ loading: false })
            onComplete()
        }, 300)
    }

    instance.forward = () => {
        debugger
    }

    instance.onItemInput = createItemInput({
        cache: responseCache,
        debug: api.debug,
    })
    instance.onItemLoad = createItemLoad({
        cache: responseCache,
        debug: api.debug,
    })
})

Template.trial.helpers({
    initComplete() {
        return Template.getState('dependenciesComplete') && !Template.getState('loading')
    },
    color() {
        return Template.getState('color') ?? 'primary'
    },
    view(name) {
        if (!name) return false
        const current = Template.getState('view')
        return name === current
    },
    showProgress() {
        return [
            TRIAL_VIEWS.story.name,
            TRIAL_VIEWS.unit.name,
        ].includes(Template.getState('view'))
    },
    progress() {
        return Template.getState('progress')
    },
    // UNIT RELATED HELPERS
    unitLoadComplete() {
        return Template.getState('unitDoc') && Template.instance().renderersLoaded.get()
    },
    unitRendererData () {
        if (!Template.instance().renderersLoaded.get()) return

        const instance = Template.instance()
        const trialDoc = instance.state.get('trialDoc')
        const unitDoc = instance.state.get('unitDoc')
        const color = instance.state.get('color')
        const currentPageCount = instance.state.get('currentPageCount')

        return {
            isPreview: true,
            isLearning: true,
            currentPageCount,
            sessionId: trialDoc._id,
            doc: unitDoc,
            color,
            onInput: instance.onItemInput,
            onLoad: instance.onItemLoad,
            onNewPage: instance.onNewPage,
            onEvaluate: instance.onEvaluate,
            onFinish: instance.forward,
            onLoadError: (err) => console.error(err),
            onLoadComplete: () => console.warn('item renderer load complete'),
        }
    }
})

Template.trial.events({
    'click .start-btn': async function (event, instance) {
        event.preventDefault()

        // 1. start trial
        const unitSetId = instance.state.get('unitSetDoc')._id
        const trialDoc = await callMethod({
            name: Trial.methods.start,
            args: {unitSetId}
        })

        const unitDoc = await loadContentDoc({
            context: Unit,
            from: 'remote',
            throwIfNotFound: true,
            query: {_id: trialDoc.unitId},
        })

        const unit = unitDoc._id
        const hasStory = instance.state.get('hasStory')
        const isNewDoc = !trialDoc.completedAt && !trialDoc.cancelledAt && !trialDoc.continuedAt

        const view = (hasStory && isNewDoc)
            ? TRIAL_VIEWS.story.name
            : TRIAL_VIEWS.unit.name

        instance.state.set({trialDoc, view, unit})
        setQueryParam({trial: trialDoc._id, step: view, unit})
    },
    'click .forward-btn'(event, instance) {
        event.preventDefault()
        instance.forward()
    },
    'click .lea-pagenav-finish-button'(event, instance) {
        event.preventDefault()
        instance.forward()
    },
})