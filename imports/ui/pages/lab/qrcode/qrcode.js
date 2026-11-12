import { EJSON } from 'meteor/ejson'
import encodeQR from 'qr';
import {errorToObject} from "../../../../utils/object/errorToObject";
import {getQueryParam} from "../../../routing/getQueryParam";
import './qrcode.html'

Template.qrcode.onCreated(function () {
    const instance = this
    debugger
    try {
        const { url, label, icon } = fromBase64(getQueryParam('data'))
        const svg = encodeQR(url, 'svg')
        instance.state.set({ url, label, svg, icon, dependenciesComplete: true })
    } catch (e) {
        instance.state.set({ error: errorToObject(e) })
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
