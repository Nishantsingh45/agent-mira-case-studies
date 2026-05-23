# Agent Mira — Case Study Submissions

This repository contains two independent case studies built for Agent Mira:

## 📁 [Case Study A — Property Comparison & Price Prediction](./junior_case_study_package_v2/)

A web app that compares two properties side-by-side and predicts their prices
using the provided ML model.

- **Stack:** FastAPI (Python) + Vite + React + Tailwind
- **Highlights:** Custom unpickler for the provided model, mocked address
  data, side-by-side comparison view
- **Submission write-up:** [SUBMISSION.md](./junior_case_study_package_v2/SUBMISSION.md)

## 📁 [Case Study B — Real Estate Chatbot](./real_estate_chatbot/)

A chatbot that helps users find homes from three merged JSON sources, with
saved-favorites persistence and an optional LLM-powered chat mode.

- **Stack:** Express (Node.js) + Vite + React + Tailwind + MongoDB (optional)
- **NLP bonus:** OpenAI structured outputs with state-machine fallback
- **Submission write-up:** [README.md](./real_estate_chatbot/README.md)

## Quick start

Each sub-project has its own backend + frontend. Run one at a time (both
Vite dev servers default to port 5173). Detailed run instructions are in
each sub-project's README.

## Tooling notes

- Python 3.14+ for Case Study A
- Node.js 24+ for both
- No secrets are committed. `.env` files are gitignored; use the supplied
  `.env.example` as a template.
