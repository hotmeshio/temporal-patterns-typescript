import { MeshFlow, Utils, Errors, Types } from '@hotmeshio/hotmesh';

import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import { example, state as STATE } from './src/workflows';

const { guid } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Unknown Error', () => {
  const toThrowCount = 3;
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
          args: [toThrowCount],
          taskQueue: 'unknown-world',
          workflowName: 'example',
          workflowId: guid(),
          expire: 120,
          config: {
            maximumAttempts: toThrowCount + 1,
            backoffCoefficient: 1,
            maximumInterval: '1s',
          },
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
          taskQueue: 'unknown-world',
          workflow: example,
        });
        await worker.run();
        expect(worker).toBeDefined();
      }, 20_000);
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should return successfully after retrying a workflow-generated error', async () => {
        const result = await handle.result();
        expect(result).toBe(toThrowCount);
      }, 20_000);
    });
  });

  describe('End to End', () => {
    it('should connect a client, start a workflow, and throw max retries exceeded', async () => {
      //reset counter that increments with each workflow run
      STATE.count = 0;

      //instance a client and start the workflow
      const client = new Client({ connection });
      const handle = await client.workflow.start({
        args: [toThrowCount],
        taskQueue: 'unknown-world',
        workflowName: 'example',
        workflowId: guid(),
        expire: 120,
        config: {
          //if allowed max is 1 less than errors, 597 should be thrown (max exceeded)
          maximumAttempts: toThrowCount - 1,
          backoffCoefficient: 1,
          maximumInterval: '1s',
        },
      });
      expect(handle.workflowId).toBeDefined();

      try {
        await handle.result();
        throw new Error('This should not be thrown');
      } catch (error) {
        //the workflow throws this error
        expect(error.message).toEqual('recurring-test-error');

        //...but the final error response will be a MeshFlowMaxedError after the workflow gives up
        expect(error.code).toEqual(new Errors.MeshFlowMaxedError('').code);

        //expect a stack trace
        expect(error.stack).toBeDefined();
      }
    }, 20_000);
  });
});
