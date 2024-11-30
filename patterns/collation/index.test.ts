import { Client as Postgres } from 'pg';
import { MeshFlow, Utils, Types } from '@hotmeshio/hotmesh';

import {
  createAndTruncateDatabase,
  connectionString,
} from '../../$setup/postgres';

import * as workflows from './src/workflows';

const { guid } = Utils;
const { Connection, Client, Worker } = MeshFlow;

const pg_connection = {
  class: Postgres,
  options: { connectionString },
};

describe('TEMPORAL PATTERNS | Collation', () => {
  let workflowId: string;

  beforeAll(async () => {
    await createAndTruncateDatabase(true);
  }, 20_000);

  afterAll(async () => {
    await MeshFlow.shutdown();
  }, 20_000);

  describe('Connection', () => {
    describe('connect', () => {
      it('should echo the backend config', async () => {
        const connection = (await Connection.connect(
          pg_connection,
        )) as Types.ProviderConfig;
        expect(connection).toBeDefined();
        expect(connection.options).toBeDefined();
      });
    });
  });

  describe('Client', () => {
    describe('start', () => {
      it('should connect a client and start a workflow execution', async () => {
        const client = new Client({
          connection: pg_connection,
        });

        ({ workflowId } = await client.workflow.start({
          args: [],
          taskQueue: 'loop-world',
          workflowName: 'example',
          workflowId: 'workflow-' + guid(),
          expire: 120,
        }));
        expect(workflowId).toBeDefined();
      }, 20_000);
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create and run a worker', async () => {
        const worker = await Worker.create({
          connection: pg_connection,
          taskQueue: 'loop-world',
          guid: 'worker-ngn',
          workflow: workflows.example,
        });
        await worker.run();
        expect(worker).toBeDefined();
      }, 20_000);
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('run await 3 functions and one sleepFor in parallel', async () => {
        const client = new Client({
          connection: pg_connection,
        });

        const handle = await client.workflow.getHandle(
          'loop-world',
          'example',
          workflowId, //global variable/ref to the workflowId
        );
        const result = await handle.result();

        expect(result).toEqual(['Hello, 1!', 'Hello, 2!', 'Hello, 3!', 5]);
      }, 30_000);
    });
  });
});
