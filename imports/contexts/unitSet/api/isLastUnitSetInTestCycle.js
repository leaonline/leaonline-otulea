export const isLastUnitSetInTestCycle = (unitSetId, testCycleDoc) => {
  const unitSets = testCycleDoc.unitSets || []
  return unitSets.length > 0 &&
    unitSets.indexOf(unitSetId) === unitSets.length - 1
}
