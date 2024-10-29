# temporal-patterns-typescript
This repo contains Temporal.io pattern examples designed to run instead using HotMesh. Each example is authored as a set of unit tests. And assertions are made against the runtime to show various patterns and uses. Each test fully wipes the database before running.

## Getting Started

### Requirements
- Node.js
- npm
- Docker

### Installation
1. Clone the repository
2. Install the dependencies
```bash
npm install
```
3. Startup Docker
```bash
docker compose up
```
4. Exec `npm test` from within Docker
```bash
npm test
```

