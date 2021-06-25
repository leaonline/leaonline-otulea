export const createGetMethod = ({ context, run }) => {
  const runFunction = run || function ({ _id }) {
    return context.collection.findOne(_id)
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
