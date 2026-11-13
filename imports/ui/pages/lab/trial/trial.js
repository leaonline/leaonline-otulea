import {Trial} from "../../../../contexts/trial/Trial";
import {Dimension} from "../../../../contexts/Dimension";
import {Unit} from "../../../../contexts/Unit";
import {UnitSet} from "../../../../contexts/unitSet/UnitSet";
import trialLang from "./i18n/lang";
import {loadContentDoc} from "../../../loading/loadContentDoc";
import {TestCycle} from "../../../../contexts/testcycle/TestCycle";
import { Session } from "../../../../contexts/session/Session";
import {Scoring} from '../../../../contexts/Scoring'
import {getQueryParam} from "../../../routing/getQueryParam";
import {setQueryParam} from "../../../routing/setQueryParam";
import {callMethod} from "../../../../infrastructure/methods/callMethod";
import './trial.html'
import '../../unit/unit'
import '../../story/story'
import {createLoadSession, createLoadTrialData, createLoadUnitData, createSessionStarter} from "./loader";
import {errorToObject} from "../../../../utils/object/errorToObject";
import {Users} from "../../../../contexts/user/User";
import {asyncTimeout} from "../../../../utils/asyncTimeout";
import { loginAsync} from "../../../../api/accounts/loginAsync";

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
    instance.fail = error => {
        console.error(error)
        instance.state.set({ error: errorToObject(error) })
    }
    instance.getView = name => TRIAL_VIEWS[name]
    instance.setView = view => {
        instance.state.set({ view })
        setQueryParam({ step: view })
    }
    instance.isRunningView = (name) => [
        TRIAL_VIEWS.story.name,
        TRIAL_VIEWS.unit.name,
    ].includes(name)
    instance.loadTrialData = createLoadTrialData({ instance })
    instance.loadSession = createLoadSession({ instance })
    instance.sessionIsComplete = sessionDoc => !!sessionDoc.completedAt
    instance.loadUnitData = createLoadUnitData({ instance })
    instance.startSession = createSessionStarter({ instance })
    instance.finishStory = () => {
        const view = TRIAL_VIEWS.unit.name
        instance.state.set({ view })
        setQueryParam({step: view })
    }
    instance.nextUnitSet = ({ completed, hasStory, sessionId, unitId, unitSetId }) => {
        instance.state.set('loading', true)

        if (hasStory) {
            const view = TRIAL_VIEWS.story.name
            instance.state.set({ view })
            setQueryParam({step: view })
        }


        nextUnit()
            .then(instance.state.set('loading', false))
            .catch(instance.fail)
    }

    const nextUnit = async () => {
        const sessionDoc = await instance.loadSession({ testCycleId: instance.state.get('testCycleId'), trialId: instance.state.get('trialId') })
        if (!sessionDoc || instance.sessionIsComplete(sessionDoc)) {
            return instance.finishUnitSet()
        }

        return instance.loadUnitData({ sessionDoc })
    }

    instance.finishUnitSet = () => {
        Meteor.logout(error => {
            if (error) instance.fail(error)
        })
        instance.setView(TRIAL_VIEWS.finish.name)
    }

    // context scope
    const { testCycleId, trialId } = instance.data.params
    instance.state.set({ testCycleId, trialId })

    // general dependencies
    const { api } = instance.initDependencies({
        language: true,
        contexts: [Dimension, Unit, UnitSet, Trial, Session, TestCycle],
        tts: true,
        debug: true,
        user: true,
        translations: trialLang,
        onComplete: async () => {
            if (!Meteor.user()) {
                const code = await callMethod({ name: Users.methods.generateCode, args: {}})
                await callMethod({ name: Users.methods.register, args: { code }})
                await loginAsync(code)
                await asyncTimeout(300)
            }

            // always load session as early as possible
            const sessionDoc = await instance.loadSession({ testCycleId, trialId })

            // get starting view state from query param, if none exists, use start
            let view = TRIAL_VIEWS.start.name
            const viewQuery = getQueryParam('step')

            // only allow unit/story view if we have a session doc
            if (viewQuery !== view && sessionDoc) {
                view = viewQuery
                setQueryParam({ step: view })
            } else {
                // clean all query params
                setQueryParam({ step: null })
            }

            instance.state.set({ view })

            // if we are already running (after page reload)
            // we need the correct data
            if (sessionDoc && instance.isRunningView(view)) {
                await instance.loadUnitData({ sessionDoc })
            }

            instance.state.set('dependenciesComplete', true)
        },
        onError: (e) => {
            instance.fail(e)
            instance.state.set('dependenciesComplete', true)
        },
    })
})

Template.trial.helpers({
    initComplete() {
        return Template.getState('dependenciesComplete') && !Template.getState('loading')
    },
    error () {
        return Template.getState('error')
    },
    color() {
        return Template.getState('color') ?? 'primary'
    },
    sessionDoc () {
        return Template.getState('sessionDoc')
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
    storyData () {
        const sessionDoc = Template.getState('sessionDoc')
        const currentUnit = sessionDoc.currentUnit
        const finishStory = Template.instance().finishStory
      return {
          params: { sessionId: sessionDoc._id, unitId: currentUnit },
          exit: finishStory,
          next: finishStory
      }
    },
    unitRendererData () {
        const sessionDoc = Template.getState('sessionDoc')
        const currentUnit = sessionDoc.currentUnit
        const instance = Template.instance()
        const finish = instance.finishUnitSet
        const next = instance.nextUnitSet
        const exit = instance.fail
        return {
            params: { sessionId: sessionDoc._id, unitId: currentUnit },
            exit,
            next,
            finish,
        }
    }
})

Template.trial.events({
    'click .start-btn': async (event, instance) => {
        event.preventDefault()
        try {
            const testCycleId = instance.state.get('testCycleId')
            const trialId = instance.state.get('trialId')
            // start new session as we usually do in overview
            const sessionDoc = await instance.startSession({ testCycleId, trialId })
            // get unit docs
            const { unitSetDoc } = await instance.loadUnitData({ sessionDoc })
            const view = (unitSetDoc.story.length)
                ? TRIAL_VIEWS.story.name
                : TRIAL_VIEWS.unit.name
            instance.state.set({ sessionDoc })
            instance.setView(view)
        } catch (e) {
            instance.fail(e)
        }
    },
    'click .continue-btn': async (event, instance) => {
        event.preventDefault()
        try {
            const testCycleId = instance.state.get('testCycleId')
            const trialId = instance.state.get('trialId')
            let sessionDoc = instance.state.get('sessionDoc')
            const sessionId = sessionDoc._id
            // start new session as we usually do in overview
            sessionDoc = await instance.startSession({ sessionId, isContinue: true })

            // get unit docs
            const { unitSetDoc } = await instance.loadUnitData({ sessionDoc })
            const view = (unitSetDoc.story.length)
                ? TRIAL_VIEWS.story.name
                : TRIAL_VIEWS.unit.name
            instance.state.set({ sessionDoc })
            instance.setView(view)
        } catch (e) {
            instance.fail(e)
        }
    },
    'click .complete-btn' (event, instance) {
        event.preventDefault()
        instance.setView(TRIAL_VIEWS.start.name)
    }
})