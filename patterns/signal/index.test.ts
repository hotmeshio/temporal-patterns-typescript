import { MeshFlow, Types, Utils } from '@hotmeshio/hotmesh';

const { guid, sleepFor } = Utils;
import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as workflows from './src/workflows';
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Signal | Wait For Signal', () => {
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
          args: ['ColdMush'],
          taskQueue: 'hello-world',
          workflowName: 'example',
          workflowId: guid(),
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
          taskQueue: 'hello-world',
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
        //signal using the original client handle
        await sleepFor(3_000);
        await handle.signal('abcdefg', { name: 'WarmMash' });

        //signal by instancing a new client connection
        await sleepFor(1_000);
        const client = new Client({ connection });
        await client.workflow.signal('hijklmnop', { name: 'WarnCrash' });

        const result = await handle.result();
        expect(result).toEqual([
          'Hello, stranger!',
          { name: 'WarmMash' },
          { name: 'WarnCrash' },
          'Hello, ColdMush!',
        ]);
      }, 15_000);
    });
  });
});
