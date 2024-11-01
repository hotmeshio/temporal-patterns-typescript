import Redis from 'ioredis';
import { MeshFlow, Utils, Types  } from '@hotmeshio/hotmesh';
import { RedisConnection } from '@hotmeshio/hotmesh/build/services/connector/clients/ioredis';
import { HMSH_CODE_INTERRUPT } from '@hotmeshio/hotmesh/build/modules/enums';

import config from '../../$setup/config';
import * as workflows from './src/workflows';

const { guid, sleepFor } = Utils;
const { Connection, Client, Worker } = MeshFlow;


describe('TEMPORAL PATTERNS | sleep | `Suspend > Sleep > Reawaken`', () => {
  let handle: any;
  let workflowGuid: string;
  let interruptedWorkflowGuid: string;
  const options = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DATABASE,
  };

  beforeAll(async () => {
    //init Redis and flush db
    const redisConnection = await RedisConnection.connect(
      guid(),
      Redis,
      options,
    );
    redisConnection.getClient().flushdb();
  });

  afterAll(async () => {
    await sleepFor(1500);
    await MeshFlow.shutdown();
  }, 10_000);

  describe('Connection', () => {
    describe('connect', () => {
      it('should echo the Redis config', async () => {
        const connection = await Connection.connect({
          class: Redis,
          options,
        });
        expect(connection).toBeDefined();
        expect(connection.options).toBeDefined();
      });
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create and run a worker', async () => {
        const worker = await Worker.create({
          connection: {
            class: Redis,
            options,
          },
          taskQueue: 'hello-world',
          workflow: workflows.example,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });
    });
  });

  describe('Client', () => {
    describe('start', () => {
      workflowGuid = guid();
      interruptedWorkflowGuid = guid();
      it('should connect a client and start a workflow execution', async () => {
        const client = new Client({ connection: { class: Redis, options } });

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
      });
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should interrupt a workflow execution and throw a `410` error', async () => {
        const client = new Client({ connection: { class: Redis, options } });
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
          expect((e as Types.StreamError).job_id).toEqual(interruptedWorkflowGuid);
          expect((e as Types.StreamError).code).toEqual(HMSH_CODE_INTERRUPT);
        }
      });

      it('should return the workflow execution result', async () => {
        const client = new Client({ connection: { class: Redis, options } });
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
