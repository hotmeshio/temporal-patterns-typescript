import { MeshFlow, Types, Utils } from '@hotmeshio/hotmesh';

import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as childWorkflows from './child/workflows';
import * as parentWorkflows from './parent/workflows';

const { guid, s } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Composition', () => {
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
        try {
          const client = new Client({ connection });
          const h = client.workflow.start({
            args: ['PARENT', false], //setting to false optimizes workflow by suppressing the reentrant branch
            taskQueue: 'parent-world',
            workflowName: 'parentExample',
            workflowId: guid(),
            signalIn: false, //setting to false optimizes workflow by suppressing the reentrant branch
            expire: s('1m'),
          });
          //start another workflow to simulate startup collisions
          let handle2: any;
          const localH = client.workflow.start({
            args: ['PARENT', false],
            taskQueue: 'parent-world',
            workflowName: 'parentExample',
            workflowId: guid(),
            signalIn: false,
            expire: s('90s'),
          });
          [handle, handle2] = await Promise.all([h, localH]);
          expect(handle.workflowId).toBeDefined();
        } catch (e) {
          console.error(e);
        }
      });
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create and run the PARENT workflow worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue: 'parent-world',
          workflow: parentWorkflows.parentExample,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });

      it('should create and run the CHILD workflow worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue: 'child-world',
          workflow: childWorkflows.childExample,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should return the PARENT workflow execution result', async () => {
        const expectedOutput = {
          activityOutput: 'parentActivity, PARENT!',
          childWorkflowOutput: 'childActivity, PARENT to CHILD!',
        };
        const result = await handle.result();
        expect(result).toEqual(expectedOutput);
      }, 15_000);
    });
  });
});
