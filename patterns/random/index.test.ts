import * as Redis from 'redis';
import { MeshFlow, Types, Utils  } from '@hotmeshio/hotmesh';
import { RedisConnection } from '@hotmeshio/hotmesh/build/services/connector/clients/redis';

import config from '../../$setup/config';
import * as workflows from './src/workflows';

const { deterministicRandom, guid, sleepFor } = Utils;
const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | random | `Deterministic Random Number Generator`', () => {
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
        //NOTE: `handle` is a global variable.
        handle = await client.workflow.start({
          args: ['HotMesh'],
          taskQueue: 'random-world',
          workflowName: 'example',
          workflowId: 'workflow-' + guid(),
          expire: 180,
          //NOTE: default is true; set to false to optimize any workflow that doesn't use hooks
          signalIn: false,
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
          taskQueue: 'random-world',
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
        const result = await handle.result();
        //note: testing the deterministic random number generator
        const r1 = deterministicRandom(1);
        const r2 = deterministicRandom(3);
        expect(result).toEqual(`${r1} Random, HotMesh! ${r2}`);
      });
    });
  });
});