# Apples to Apples: Temporal vs HotMesh vs MeshFlow

The `examples/` directory includes three modules that execute the same workflow using different engines. Each module produces identical inputs and outputs, showcasing how the same workflow can be implemented across these engines:

- **`temporal`**: Temporal is a workflow engine that operates on a central app server.
- **`hotmesh`**: HotMesh is a serverless workflow engine leveraging decentralized message routers.
- **`meshflow`**: MeshFlow is HotMesh’s emulation of Temporal’s workflow engine.

HotMesh is serverless, with a pluggable backend that supports Postgres, Redis, and NATS interchangeably, while the APIs remain consistent across engines.

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
   git clone https://github.com/hotmeshio/temporal-side-by-side-typescript.git
   cd temporal-side-by-side-typescript
   ```
2. **Install Dependencies**
    ```bash
    npm install
    ```
3. **Start Docker**
    ```bash
    npm run docker:up
    ```
4. **Stop Docker**
    ```bash
    npm run docker:down
    ```
5. **Cleanup Docker**
    ```bash
    npm run docker:reset
    ```

### Testing the Engines

You can test each engine by sending HTTP GET requests to the following endpoints after the containers are loaded:

- **Temporal**:
  ```bash
  curl http://localhost:3010/api/v1/test/temporal
  ```
- **HotMesh**:
  ```bash
  curl http://localhost:3010/api/v1/test/hotmesh
  ```
- **MeshFlow**:
  ```bash
  curl http://localhost:3010/api/v1/test/meshflow
  ```
- **All Engines**:
  ```bash
  curl http://localhost:3010/api/v1/test
  ```

## Additional Resources

- **[SDK Documentation](https://docs.hotmesh.io)**: Comprehensive documentation and examples for all patterns.
- **[NPM Package](https://www.npmjs.com/package/@hotmeshio/hotmesh)**: Download the HotMesh package.
- **[Contribution Guidelines](./docs/CONTRIBUTING.md)**: Instructions for contributing to the project.

## License

This project is licensed under the Apache 2.0 License. See the LICENSE file for details.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Temporal Technologies, Inc. Temporal is a trademark of Temporal Technologies, Inc., and all references to Temporal and related technologies are for educational and demonstration purposes only.
