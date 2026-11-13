import { EJSON } from 'meteor/ejson'
import encodeQR from 'qr';
import {errorToObject} from "../../../../utils/object/errorToObject";
import {getQueryParam} from "../../../routing/getQueryParam";
import './qrcode.html'
import {Routes} from "../../../routing/Routes";

Template.qrcode.onCreated(function () {

    try {
        const route = getQueryParam('route')
        const args = (getQueryParam('args') ?? '').split(',')
        const label = getQueryParam('label')
        const path = Routes[route].path.apply(null, args)
        const url = Meteor.absoluteUrl(path)
        const svg = encodeQR(url, 'svg')
        this.state.set({ url, label, svg, dependenciesComplete: true })
    } catch (e) {
        this.state.set({ error: errorToObject(e) })
    }
})

Template.qrcode.helpers({
    dependenciesComplete () {
        return Template.getState('dependenciesComplete')
    },
    qrSVG () {
        return Template.getState('svg')
    },
    url () {
        return Template.getState('url')
    },
    label () {
        return Template.getState('label')
    },
    iconName () {
        return Template.getState('icon')
    },
})

const fromBase64 = base =>  {
    const decoded = decodeURIComponent(base)
    const dataStr = atob(decoded)
    return EJSON.parse(dataStr)
}
