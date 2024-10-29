# temporal-patterns-typescript

This repository demonstrates common [Temporal.io](https://temporal.io/) design patterns using HotMesh. Each example pattern is authored as a set of unit tests with assertions made against the runtime, showcasing various patterns and use cases. Each test case cleans the database state to ensure consistency and isolation for each run.

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
    docker compose up
    ```
4. Exec `npm test` from within Docker
    ```bash
    npm test
    ```

For detailed explanations of each pattern, see the pattern pages in the [HotMesh Temporal Patterns documentation](https://hotmeshio.github.io/sdk-typescript/).

### Pattern List 
 - [**Collation**](./patterns/collation): Demonstrates grouping tasks and merging results across workflow instances. 
 - [**Composition**](./patterns/composition): Highlights workflow composition, enabling modular and reusable task sequences.
 - [**Error (Unknown)**](./patterns/error-unknown): Handles unexpected errors in workflows with resilience strategies.
 - [**Error (Fatal)**](./patterns/error-fatal): Manages workflows with unrecoverable errors, ensuring a safe failure state.
 - [**Everything**](./patterns/everything): A comprehensive test case combining multiple patterns for a full integration scenario.
 - [**Transactional Hook**](./patterns/hook): Implements a hook mechanism for transactional workflow subprocess execution.
 - [**Idempotency**](./patterns/idempotency): Ensures tasks produce consistent outcomes across retries or repeated executions.
 - [**Interrupt**](./patterns/interrupt): Demonstrates pausing and resuming workflows based on external events.
 - [**Retry**](./patterns/retry): Shows retry mechanisms for tasks, defining custom retry intervals and strategies.
 - [**Search**](./patterns/search): Integrates search capabilities within workflows to retrieve relevant data dynamically.
 - [**Signal**](./patterns/signal): Uses signaling to awaken paused workflows from external inputs=.
 - [**Sleep**](./patterns/sleep): Demonstrates controlled delays and pausing workflows between tasks. 

Visit each pattern’s page to see example code and unit test cases in action.

## Additional Resources

- **[SDK Documentation](https://hotmeshio.github.io/sdk-typescript/)**: Detailed documentation and examples of each pattern.
- **[Download (NPM)](https://www.npmjs.com/package/@hotmeshio/hotmesh)**: Access the HotMesh package on npm.

## License

The examples in this project are licensed under the Apache 2.0 License. See the LICENSE file for more details.

## Contributing

Contributions are welcome! Please follow the [contribution guidelines](CONTRIBUTING.md) to submit pull requests or open issues.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Temporal Technologies, Inc. Temporal is a trademark of Temporal Technologies, Inc., and all references to Temporal and related technologies are for educational and demonstration purposes only.
