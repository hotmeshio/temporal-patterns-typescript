import { MeshFlow, Types, Utils } from '@hotmeshio/hotmesh';

const { guid, sleepFor } = Utils;
import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as workflows from './src/workflows';
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Search', () => {
  const prefix = 'bye-world-';
  const namespace = 'prod';
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
          args: ['HotMesh'],
          taskQueue: 'search-world',
          workflowName: 'example',
          workflowId: workflowGuid,
          expire: 120,
          //SEED the initial workflow state with data (this is
          //different than the 'args' input data which the workflow
          //receives as its first argument...this data is available
          //to the workflow via the 'search' object)
          //NOTE: data (user data) can be updated during workflow execution
          //      and is considered to be mutable like job data
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
          connection,
          namespace,
          taskQueue: 'search-world',
          workflow: workflows.example,
          //SEED the initial workflow state with custom user data
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

      it('should create a hook worker', async () => {
        const worker = await Worker.create({
          connection,
          namespace,
          taskQueue: 'search-world',
          workflow: workflows.exampleHook,
        });
        await worker.run();
        expect(worker).toBeDefined();
      }, 10_000);

      it('should create a hook client and publish to invoke a hook', async () => {
        //sleep so the main thread gets into a paused state
        await sleepFor(2_000);

        //send a hook to spawn a hook thread attached to this workflow
        await client.workflow.hook({
          namespace,
          taskQueue: 'search-world',
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
        const handle = await client.workflow.getHandle(
          'search-world',
          workflows.example.name,
          workflowGuid,
          namespace,
        );
        const result = await handle.result();
        expect(result).toEqual('Hello, HotMesh! - Search, HotMesh!');

        //call a search query to look for
        //NOTE: include an underscore before the search term (e.g., `_term`).
        //      (HotMesh uses `_` to avoid collisions with reserved words
        const results = (await client.workflow.search(
          'goodbye-world',
          workflows.example.name,
          namespace,
          'sql',
          'SELECT job_id FROM prod.jobs_attributes WHERE field = $1 and value = $2',
          '_custom1',
          'meshflow',
        )) as unknown as { job_id: string }[];

        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results[0].job_id).toBeDefined();
      }, 7_500);
    });
  });
});
