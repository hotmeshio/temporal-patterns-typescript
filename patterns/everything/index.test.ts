import * as Redis from 'redis';
import { MeshFlow, Types, Utils  } from '@hotmeshio/hotmesh';
import { RedisConnection } from '@hotmeshio/hotmesh/build/services/connector/clients/redis';

import config from '../../$setup/config';
import * as workflows from './src/workflows';

const { deterministicRandom, guid, sleepFor } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | everything', () => {
  let handle: any;
  const options = {
    socket: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      tls: false,
    },
    password: config.REDIS_PASSWORD,
    database: config.REDIS_DATABASE,
  };

  beforeAll(async () => {
    //init Redis and flush db
    const redisConnection = await RedisConnection.connect(
      guid(),
      Redis as unknown as Types.RedisRedisClassType,
      options,
    );
    redisConnection.getClient().flushDb();
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

  describe('Client', () => {
    describe('start', () => {
      it('should connect a client and start a workflow execution', async () => {
        const client = new Client({ connection: { class: Redis, options } });
        handle = await client.workflow.start({
          args: ['HotMesh'],
          taskQueue: 'everything-world',
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
      const connection = {
        class: Redis,
        options,
      };
      const taskQueue = 'everything-world';

      it('should create and run a parent worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue,
          workflow: workflows.example,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });

      it('should create and run a child worker', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue,
          workflow: workflows.childExample,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });
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
          jobId: 'MyWorkflowId123',
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
