// A deliberately simple, self-contained tool — no external API, no
// dependencies on other services. This exists so you can clearly see
// the model choosing BETWEEN two different tools based on what the
// question actually needs, rather than always reaching for the same
// one.

const definition = {
  type: 'function',
  function: {
    name: 'get_current_datetime',
    description: "Returns the current date and time. Use this if the user asks what today's date is, what time it is, or anything relative to 'now'.",
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};

async function execute() {
  return new Date().toString();
}

module.exports = { definition, execute };