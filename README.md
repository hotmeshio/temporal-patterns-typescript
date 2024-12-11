# Temporal Patterns

This repository demonstrates common [Temporal.io](https://temporal.io/) design patterns deployed using **HotMesh**. Each example pattern is authored as a set of unit tests with assertions made against the runtime.

Although the APIs are the same, HotMesh is serverless and uses decentralized message routers. The backend is pluggable and interchangeably supports Postgres, Redis, and NATS.

| Temporal | HotMesh |
|:--------:|:-------:|
| <img src="./docs/img/tmp.png" width="400"/> | <img src="./docs/img/hms.png" width="400"/> |

## Getting Started

### Requirements
- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/hotmeshio/temporal-patterns-typescript.git
   cd temporal-patterns-typescript
   ```
2. **Install** the dependencies
    ```bash
    npm install
    ```
3. Startup Docker
    ```bash
    npm run docker:up
    ```
4. **Shutdown Docker**
    ```bash
    npm run docker:down
    ```
5. **Cleanup Docker**
    ```bash
    npm run docker:reset
    ```
6. **Run Unit Tests** from within Docker (Postgres is the default backend).
    ```bash
    npm test
    ```
7. **Run a Single Test (e.g., collation)**
    ```bash
    npm run test:collation
    ```

### Pattern List 
 - [**Collation**](./patterns/collation): Demonstrates `Promise.all` behavior in a reentrant workflow. 
 - [**Composition**](./patterns/composition): Highlights parent-child workflow interactions.
 - [**Error (Unknown)**](./patterns/error-unknown): Handles unexpected errors in workflows with resilience strategies.
 - [**Error (Fatal)**](./patterns/error-fatal): Highlights workflows with unrecoverable errors.
 - [**Everything**](./patterns/everything): A comprehensive test case combining multiple patterns, including: `hook`, `signal`, `search`, `sleep` and `interrupt`.
 - [**Transactional Hook**](./patterns/hook): Implements a hook mechanism for transactional workflow subprocess execution.
 - [**Idempotency**](./patterns/idempotency): Ensures idempotent behavior in workflows for replay safety.
 - [**Interrupt**](./patterns/interrupt): Demonstrates cancelling a running workflow based on external events.
 - [**Random**](./patterns/random): Deterministically generates random numbers in workflows appropriate for *replay*.
 - [**Retry**](./patterns/retry): Shows retry configurability and strategies for handling transient errors (like a flaky endpoint).
 - [**Search**](./patterns/search): Integrates search capabilities within workflows to read and write user data idempotently.
 - [**Signal**](./patterns/signal): Uses signaling to awaken paused workflows from *external* and *internal* inputs.
 - [**Sleep**](./patterns/sleep): Demonstrates internally-triggered delays in workflow execution along with externally-triggered interruptions. 

Visit each pattern’s page to see example code and unit test cases in action.

## Additional Resources

- **[SDK Documentation](https://hotmeshio.github.io/sdk-typescript/)**: Detailed documentation and examples of each pattern.
- **[Download (NPM)](https://www.npmjs.com/package/@hotmeshio/hotmesh)**: Access the HotMesh package on npm.

## License

The examples in this project are licensed under the Apache 2.0 License. See the LICENSE file for more details.

## Contributing

Contributions are welcome! Please follow the [contribution guidelines](./docs/CONTRIBUTING.md) to submit pull requests or open issues.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Temporal Technologies, Inc. Temporal is a trademark of Temporal Technologies, Inc., and all references to Temporal and related technologies are for educational and demonstration purposes only.
