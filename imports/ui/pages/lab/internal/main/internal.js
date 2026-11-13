import './internall.html'
import {Unit} from "../../../../../contexts/Unit";
import {Trial} from "../../../../../contexts/trial/Trial";
import {errorToObject} from "../../../../../utils/object/errorToObject";
import unitDevLang from "../unitdev/i18n/lang";
import {dataTarget} from "../../../../../utils/dataTarget";

const VIEWS = {
    units: {
        name: 'units',
        label: 'internal.unitdev',
        icon: Unit.icon,
        load() {
            return import('../unitdev/unitDev')
        },
        template: 'unitDev'
    },
    trials: {
        name: 'trials',
        label: 'internal.trials',
        icon: Trial.icon,
        load() {
            return import('../trials/trials')
        },
        template: 'trials'
    }
}

Template.internal.onCreated(function () {

    this.views = Object.values(VIEWS).map(({ name, label, icon }) => ({ name, label, icon }))
    this.fail = error => this.state.set({error: errorToObject(error)})
    this.load = async (name) => {
        this.state.set('loading', true)
        const view = typeof name === 'object' ? name : VIEWS[name]

        try {
            if (!view.loaded) await view.load()
            view.loaded = true
        } catch (e) {
            this.fail(e)
        } finally {
            this.state.set('loading', false)
        }
        this.state.set({view: view.name, template: view.template })
    }

    this.initDependencies({
        language: true,
        contexts: [],
        tts: true,
        debug: true,
        translations: unitDevLang,
        onComplete: async () => {
            await this.load(VIEWS.units)
            this.state.set('dependenciesComplete', true)
        },
        onError: (e) => {
            this.data.onFail(e)
            this.state.set('dependenciesComplete', true)
        },
    })

})

Template.internal.helpers({
    dependenciesComplete() {
        return Template.getState('dependenciesComplete') && !Template.getState('loading')
    },
    view(name) {
        const view = Template.getState('view')
        if (name) return view == name
        return view
    },
    views () {
        return Template.instance().views
    },
    template() {
        return Template.getState('template')
    },
    error () {
        return Template.getState('error')
    }
})

Template.internal.events({
    'click .internal-view'(event, instance) {
        const view = dataTarget(event, 'view')
        instance.load(view).catch(instance.fail)
    }
})