Meteor.startup(() => {
  setTimeout(async () => {
    await import('@fortawesome/fontawesome-free/js/fontawesome')
    await import('@fortawesome/fontawesome-free/js/solid')
  }, 500)
})