export const createGetAllMethod = ({ context, run }) => {
  const getAllFunction = run || async function ({ ids }) {
    const query = {}
    if (ids) query._id = { $in: ids }

    return {
      [context.name]: context.collection().find(query).fetchAsync()
    }
  }

  return {
    name: `${context.name}.methods.getAll`,
    backend: true,
    schema: {
      ids: {
        type: Array,
        optional: true
      },
      'ids.$': String,
      dependencies: {
        type: Array,
        optional: true
      },
      'dependencies.$': String
    },
    run: getAllFunction
  }
}
