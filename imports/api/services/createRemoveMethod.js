export const createRemoveMethod = ({ context, run }) => {
  const removeFunction = run || function ({ _id }) {
    return context.collection().remove({ _id })
  }

  return {
    name: `${context.name}.methods.remove`,
    backend: true,
    schema: {
      _id: String
    },
    run: removeFunction
  }
}
