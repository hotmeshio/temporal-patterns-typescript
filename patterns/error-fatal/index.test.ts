import Redis from 'ioredis';
import { MeshFlow, Utils  } from '@hotmeshio/hotmesh';
import { RedisConnection } from '@hotmeshio/hotmesh/build/services/connector/clients/ioredis';
import { MeshFlowFatalError } from '@hotmeshio/hotmesh/build/modules/errors';

import config from '../../$setup/config';
import * as workflows from './src/workflows';

const { guid, sleepFor } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | fatal | `Fatal Workflow Error`', () => {
  const NAME = 'hot-mess';
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
        handle = await client.workflow.start({
          args: [{ name: NAME }],
          taskQueue: 'fatal-world',
          workflowName: 'example',
          workflowId: guid(),
          expire: 120, //ensures the failed workflows aren't scrubbed too soon (so they can be reviewed (but unnecessary for the test to succeed))
        });
        expect(handle.workflowId).toBeDefined();
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
          taskQueue: 'fatal-world',
          workflow: workflows.default.example,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it('should throw the fatal error with `code` and `message`', async () => {
        try {
          //the activity will throw `598 [MeshFlowFatalError]; the workflow will rethrow;`
          await handle.result();
          throw new Error('This should not be thrown');
        } catch (err) {
          expect(err.message).toEqual(`stop-retrying-please-${NAME}`);
          expect(err.code).toEqual(new MeshFlowFatalError('').code);
        }
      });
    });
  });
});
