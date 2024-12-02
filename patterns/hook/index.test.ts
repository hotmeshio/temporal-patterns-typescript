import { MeshFlow, Utils, Types } from '@hotmeshio/hotmesh';

import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as workflows from './src/workflows';
import * as childWorkflows from './child/workflows';

const { guid, sleepFor } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Hook', () => {
  const namespace = 'staging';
  const prefix = 'bye-world-';
  let client: any;
  let workflowGuid: string;

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
        client = new Client({ connection });
        workflowGuid = prefix + guid();

        const handle = await client.workflow.start({
          namespace,
          args: ['HookMesh'],
          taskQueue: 'hook-world',
          workflowName: 'example',
          workflowId: workflowGuid,
          expire: 600,
          //SEED the initial workflow state with custom user data
          search: {
            data: {
              fred: 'flintstone',
              barney: 'rubble',
            },
          },
        });
        expect(handle.workflowId).toBeDefined();
      }, 10_000);
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create a worker', async () => {
        const worker = await Worker.create({
          namespace,
          connection,
          taskQueue: 'hook-world',
          workflow: workflows.example,

          //NOTE: if the index doesn't exist, it will be created.
          //      Redis backends with the FT module enabled support this:
          //      (other modules should silently ignore this)
          search: {
            index: 'bye-bye',
            prefix: [prefix],
            schema: {
              custom1: {
                type: 'TEXT',
                sortable: true,
              },
              custom2: {
                type: 'NUMERIC', //or TAG
                sortable: true,
              },
            },
          },
        });
        await worker.run();
        expect(worker).toBeDefined();
      }, 10_000);

      it('should create and run the CHILD workflow worker', async () => {
        //the main flow has an execChild command which will be serviced
        //by this worker
        const worker = await Worker.create({
          namespace,
          connection,
          taskQueue: 'child-world',
          workflow: childWorkflows.childExample,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });

      it('should create a hook worker', async () => {
        const worker = await Worker.create({
          namespace,
          connection,
          taskQueue: 'hook-world',
          workflow: workflows.exampleHook,
        });
        await worker.run();
        expect(worker).toBeDefined();
      }, 10_000);

      it('should spawn a hook and deploy the hook function', async () => {
        //sleep so the main thread fully executes and gets into a paused state
        //where it is awaiting a signal
        await sleepFor(2_500);

        //send a `hook` to spawn a hook thread attached to this workflow
        //the exampleHook function will be invoked in job context, allowing
        //it to read/write/augment shared job state with transactional integrity
        await client.workflow.hook({
          namespace,
          taskQueue: 'hook-world',
          workflowName: 'exampleHook',
          workflowId: workflowGuid,
          args: ['HotMeshHook'],
        });
      }, 10_000);
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should return the workflow execution result', async () => {
        //get the workflow handle and wait for the result
        const handle = await client.workflow.getHandle(
          'hook-world',
          workflows.example.name,
          workflowGuid,
          namespace,
        );
        const result = await handle.result({ state: true });
        expect(result).toEqual('Hello, HookMesh! - Goodbye, HookMesh!');

        const exported = await handle.export({
          allow: ['timeline', 'status', 'data', 'state'],
          values: false,
        });
        expect(exported.status).not.toBeUndefined();
        expect(exported.data?.fred).toBe('flintstone');
        expect(exported.state?.data.done).toBe(true);

        //execute raw SQL to locate the custom data attribute
        //NOTE: include an underscore prefix before the search term (e.g., `_custom1`).
        //      HotMesh uses this to avoid collisions with reserved words
        const results = (await client.workflow.search(
          'hook-world',
          workflows.example.name,
          namespace,
          'sql',
          'SELECT job_id FROM staging.jobs_attributes WHERE field = $1 and value = $2',
          '_custom1',
          'meshflow',
        )) as unknown as { job_id: string }[];

        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results[0].job_id).toBeDefined();
      }, 35_000);
    });
  });
});
