import Redis from 'ioredis';
import { MeshFlow, Utils  } from '@hotmeshio/hotmesh';
import { RedisConnection } from '@hotmeshio/hotmesh/build/services/connector/clients/ioredis';

import config from '../../$setup/config';
import * as workflows from './src/workflows';

const { guid, sleepFor } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | collation | `Promise.all: Suspend>Collate>Awaken`', () => {
  let handle: any;
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

  describe('Client', () => {
    describe('start', () => {
      it('should connect a client and start a workflow execution', async () => {
        const client = new Client({ connection: { class: Redis, options } });
        //NOTE: `handle` is a global variable.
        handle = await client.workflow.start({
          args: [],
          taskQueue: 'loop-world',
          workflowName: 'example',
          workflowId: 'workflow-' + guid(),
          expire: 120, //ensures the failed workflows aren't scrubbed too soon (so they can be reviewed)
        });
        expect(handle.workflowId).toBeDefined();
      });
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create and run a worker', async () => {
        const worker = await Worker.create({
          connection: { class: Redis, options },
          taskQueue: 'loop-world',
          workflow: workflows.example,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('run await 3 functions and one sleepFor in parallel', async () => {
        const result = await handle.result();
        expect(result).toEqual(['Hello, 1!', 'Hello, 2!', 'Hello, 3!', 5]);
      }, 15_000);
    });
  });
});
