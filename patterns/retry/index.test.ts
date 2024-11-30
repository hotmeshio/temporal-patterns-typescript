import { MeshFlow, Types, Utils } from '@hotmeshio/hotmesh';

import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as workflows from './src/workflows';

const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Retry', () => {
  const errorCycles = 3;
  let handle: any;

  beforeAll(async () => {
    await createAndTruncateDatabase(true);
  }, 20_000);

  afterAll(async () => {
    await MeshFlow.shutdown();
  }, 20_000);

  describe('Connection', () => {
    describe('connect', () => {
      it('should echo the provider config', async () => {
        const con = (await Connection.connect(
          connection,
        )) as Types.ProviderConfig;
        expect(con).toBeDefined();
        expect(con.options).toBeDefined();
      });
    });
  });

  describe('Client', () => {
    describe('start', () => {
      it('should connect a client and start a workflow execution', async () => {
        const client = new Client({ connection });
        //NOTE: `handle` is a global variable.
        handle = await client.workflow.start({
          args: [{ amount: errorCycles }],
          taskQueue: 'sleep-world',
          workflowName: 'example',
          workflowId: Utils.guid(),
          expire: 120,
        });
        expect(handle.workflowId).toBeDefined();
      }, 10_000);
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create and run a worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue: 'sleep-world',
          workflow: workflows.default.example,
        });
        await worker.run();
        expect(worker).toBeDefined();
      }, 10_000);
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should return the workflow execution result', async () => {
        const result = await handle.result();
        expect(result).toEqual(errorCycles);
      }, 20_000);
    });
  });
});
