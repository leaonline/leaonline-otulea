export const getNextUnitSetInTestCycle = (unitSetId, testCycleDoc) => {
  const index = testCycleDoc.unitSets.indexOf(unitSetId)
  return testCycleDoc.unitSets[index + 1]
}
