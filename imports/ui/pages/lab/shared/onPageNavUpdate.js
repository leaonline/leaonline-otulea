export const onPageNavUpdate = ({ action, newPage, templateInstance, onComplete }) => {
    templateInstance.state.set({ loading: true })
    templateInstance.state.set(newPage)
    setTimeout(() => {
        templateInstance.state.set({ loading: false })
        onComplete()
    }, 300)
}