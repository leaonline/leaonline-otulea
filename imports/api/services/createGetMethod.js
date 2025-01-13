export const createGetMethod = ({ context, run }) => {
  const runFunction = run || async function ({ _id }) {
    return context.collection.findOneAsync(_id)
  }

  return {
    name: `${context.name}.methods.get`,
    backend: true,
    schema: {
      _id: String
    },
    run: runFunction
  }
}
