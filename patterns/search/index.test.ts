import * as Redis from 'redis';
import { MeshFlow, Types, Utils  } from '@hotmeshio/hotmesh';
import { RedisConnection } from '@hotmeshio/hotmesh/build/services/connector/clients/redis';

import config from '../../$setup/config';
const { guid, sleepFor } = Utils;

import * as workflows from './src/workflows';

const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | search | `Search > Index > Aggregate`', () => {
  const prefix = 'bye-world-';
  const namespace = 'prod';
  let client: any;
  let workflowGuid: string;
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
        client = new Client({ connection: { class: Redis, options } });
        workflowGuid = prefix + guid();

        const handle = await client.workflow.start({
          namespace,
          args: ['HotMesh'],
          taskQueue: 'search-world',
          workflowName: 'example',
          workflowId: workflowGuid,
          expire: 120, //keep in Redis after completion for 120 seconds
          //SEED the initial workflow state with data (this is
          //different than the 'args' input data which the workflow
          //receives as its first argument...this data is available
          //to the workflow via the 'search' object)
          //NOTE: data can be updated during workflow execution
          search: {
            data: {
              fred: 'flintstone',
              barney: 'rubble',
            },
          },
        });
        expect(handle.workflowId).toBeDefined();
      });
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create a worker', async () => {
        const worker = await Worker.create({
          connection: { class: Redis, options },
          namespace,
          taskQueue: 'search-world',
          workflow: workflows.example,
          //INDEX the search space; if the index doesn't exist, it will be created
          //(this is supported by Redis backends with the FT module enabled)
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
      });

      it('should create a hook worker', async () => {
        const worker = await Worker.create({
          connection: { class: Redis, options },
          namespace,
          taskQueue: 'search-world',
          workflow: workflows.exampleHook,
        });
        await worker.run();
        expect(worker).toBeDefined();
      });

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
        //call the FT search module to locate the workflow via fuzzy search
        //NOTE: include an underscore before the search term (e.g., `_term`).
        //      (HotMesh uses `_` to avoid collisions with reserved words
        const [count, ...rest] = await client.workflow.search(
          'search-world',
          workflows.example.name,
          namespace,
          'bye-bye',
          '@_custom1:meshflow',
        );
        expect(count).toEqual(1);
        const [id, ..._rest2] = rest;
        expect(id).toEqual(`hmsh:${namespace}:j:${workflowGuid}`);
      }, 7_500);
    });
  });
});
