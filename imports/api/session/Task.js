const ContentSchema = {
  type: String,
  subtype: String,
  value: String,
  class: {
    type: String,
    optional: true
  }
}
const ContentListSchema = {
  content: Array,
  'content.$': ContentSchema
}

const PagesSchema = {
  pages: Array,
  'pages.$': ContentListSchema
}

export const Task = {
  name: 'task',
  label: 'task.title',
  icon: 'cube',
  schema: {
    startedAt: Date,
    completedAt: Date,
    story: ContentListSchema,
    stimuli: ContentListSchema,
    pages: PagesSchema
  }
}
