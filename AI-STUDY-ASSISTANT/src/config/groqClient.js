// This file has ONE job: create the Groq client one time,
// using the API key from our environment variables.
// Every other file that needs to talk to the LLM will import this
// instead of creating its own client — that way we configure it in
// exactly one place.

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = groq;