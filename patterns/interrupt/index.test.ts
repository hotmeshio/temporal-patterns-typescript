import { MeshFlow, Types, Utils } from '@hotmeshio/hotmesh';

import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as childWorkflows from './child/workflows';
import * as parentWorkflows from './parent/workflows';

const { guid, s } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Interrupt', () => {
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
      it('should connect a client and start a PARENT workflow execution', async () => {
        const client = new Client({ connection });
        handle = await client.workflow.start({
          args: ['PARENT'],
          taskQueue: 'parent-world',
          workflowName: 'parentExample',
          workflowId: guid(),
          expire: 600,
        });
        expect(handle.workflowId).toBeDefined();
      });
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create and run the CHILD workflow worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue: 'child-world',
          workflow: childWorkflows.childExample,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });

      it('should create and run the PARENT workflow worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue: 'parent-world',
          workflow: parentWorkflows.parentExample,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });
    });
  });

  //add long test, spawn a timout that will throw a 410, await the handle
  //verify the error code is 410

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should run a PARENT that starts and then interrupts a CHILD workflow', async () => {
        const expectedOutput = {
          childWorkflowOutput: 'interrupt childActivity, PARENT to CHILD!',
          cancelledWorkflowId: 'jimbo2',
        };
        const result = (await handle.result()) as {
          cancelledWorkflowId: string;
        };
        expect(result).toEqual(expectedOutput);

        //get a handle to the interrupted workflow
        const client = new Client({ connection });
        handle = await client.workflow.getHandle(
          'child-world', //task queue
          'childExample', //workflow
          result.cancelledWorkflowId,
        );
        const state = await handle.state(true);

        //job state (js) is @ -1billion when interrupted (depending upon semaphore state when decremented)
        expect(state.metadata.js).toBeLessThan(-1_000_000);
        const rslt = await handle.result({ state: true });

        //result is undefined, since it was interrupted; there is no return;
        expect(rslt).toBeUndefined();
      }, 15_000);
    });
  });
});
