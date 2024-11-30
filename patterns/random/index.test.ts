import { MeshFlow, Types, Utils } from '@hotmeshio/hotmesh';

import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as workflows from './src/workflows';

const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Random', () => {
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
        handle = await client.workflow.start({
          args: ['HotMesh'],
          taskQueue: 'random-world',
          workflowName: 'example',
          workflowId: 'workflow-' + Utils.guid(),
          expire: 180,
          //NOTE: default is true; set to false to optimize
          //      any workflow that doesn't use hooks
          signalIn: false,
        });
        expect(handle.workflowId).toBeDefined();
      });
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create and run a worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue: 'random-world',
          workflow: workflows.example,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should return the workflow execution result', async () => {
        const result = await handle.result();
        const r1 = Utils.deterministicRandom(1);
        const r2 = Utils.deterministicRandom(3);
        expect(result).toEqual(`${r1} Random, HotMesh! ${r2}`);
      });
    });
  });
});
