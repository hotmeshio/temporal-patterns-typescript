import { MeshFlow, Utils, Types } from '@hotmeshio/hotmesh';

import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as workflows from './src/workflows';

const { guid, sleepFor } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Sleep | Interrupt', () => {
  let handle: any;
  let workflowGuid: string;
  let interruptedWorkflowGuid: string;

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
      }, 10_000);
    });
  });

  describe('Client', () => {
    describe('start', () => {
      workflowGuid = guid();
      interruptedWorkflowGuid = guid();
      it('should connect a client and start a workflow execution', async () => {
        const client = new Client({ connection });

        handle = await client.workflow.start({
          args: ['ColdMush'],
          taskQueue: 'hello-world',
          workflowName: 'example',
          workflowId: workflowGuid,
        });
        expect(handle.workflowId).toBeDefined();

        const localHandle = await client.workflow.start({
          args: ['ColdMush'],
          taskQueue: 'hello-world',
          workflowName: 'example',
          workflowId: interruptedWorkflowGuid,
        });
        expect(localHandle.workflowId).toBeDefined();
      }, 10_000);
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should interrupt a workflow execution and throw a `410` error', async () => {
        const client = new Client({ connection });
        const localHandle = await client.workflow.getHandle(
          'hello-world',
          workflows.example.name,
          interruptedWorkflowGuid,
        );
        const hotMesh = localHandle.hotMesh;
        await sleepFor(1_000); //let the activity start running
        hotMesh.interrupt(`${hotMesh.appId}.execute`, interruptedWorkflowGuid, {
          descend: true,
          expire: 1,
        });
        try {
          //subscribe to the workflow result (this will throw an `interrupted` error)
          await localHandle.result();
        } catch (e: any) {
          expect((e as Types.StreamError).job_id).toEqual(
            interruptedWorkflowGuid,
          );
          //todo: expose 410 Enum (all enums) in the HotMesh package export
          expect((e as Types.StreamError).code).toEqual(410);
        }
      });

      it('should return the workflow execution result', async () => {
        const client = new Client({ connection });
        const localHandle = await client.workflow.getHandle(
          'hello-world',
          workflows.example.name,
          workflowGuid,
        );
        const result = await localHandle.result();
        expect(result).toEqual('Hello, ColdMush!');
        //allow signals to self-clean
        await sleepFor(5_000);
      }, 60_000);
    });
  });
});
