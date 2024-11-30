import { MeshFlow, Utils, Types } from '@hotmeshio/hotmesh';

import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as workflows from './src/workflows';

const { guid, deterministicRandom, sleepFor } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Everything', () => {
  const taskQueue = 'everything-world';
  const spawnedWorkflowId = guid();
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
          args: ['HotMesh', spawnedWorkflowId],
          taskQueue,
          workflowName: 'example',
          workflowId: 'workflow-' + guid(),
          expire: 600,
        });
        expect(handle.workflowId).toBeDefined();
      });
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create and run a parent worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue,
          workflow: workflows.example,
        });
        await worker.run();
        expect(worker).toBeDefined();
      }, 10_000);

      it('should create and run a child worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue,
          workflow: workflows.childExample,
        });
        await worker.run();
        expect(worker).toBeDefined();
      }, 10_000);
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should return the workflow execution result', async () => {
        const signalId = 'abcdefg';

        //...sleep to make sure the workfow is fully paused and waiting for the signal
        await sleepFor(15_000);

        //the test workflow uses  MeshFlow.workflow.waitFor(signalId)
        //...signal it and then await the result
        const signalPayload = {
          id: signalId,
          data: { hello: 'world', id: signalId },
        };

        await handle.signal(signalId, signalPayload);
        const result = await handle.result();
        const r1 = deterministicRandom(1);
        const r2 = deterministicRandom(4);
        expect(result).toEqual({
          jobId: spawnedWorkflowId,
          payload: {
            data: {
              hello: 'world',
              id: 'abcdefg',
            },
            id: 'abcdefg',
          },
          proxyGreeting: { complex: 'Everything, HotMesh!' },
          proxyGreeting3: { complex: 'Everything, HotMesh3!' },
          proxyGreeting4: { complex: 'Everything, HotMesh4!' },
          random1: r1,
          random2: r2,
        });
      }, 30_000);
    });
  });
});
