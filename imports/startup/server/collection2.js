import Collection2 from 'meteor/aldeed:collection2'

// XXX: backwards compat for pre 4.0 collection2
if (Collection2 && typeof Collection2.load === 'function') {
  Collection2.load()
}
else {
  console.warn('Skip Collection2.load as it\'s not present!')
}
