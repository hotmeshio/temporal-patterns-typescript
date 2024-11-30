import { MeshFlow, Types } from '@hotmeshio/hotmesh';

import { createAndTruncateDatabase, connection } from '../../$setup/postgres';

import * as workflows from './src/workflows';

const { Connection, Client, Worker } = MeshFlow;

describe('TEMPORAL PATTERNS | Idempotency', () => {
  const CONFLICTING_NAME = 'idempotency-child';
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
          args: ['HotMesh'],
          taskQueue: 'idempotency-world',
          workflowName: 'example',
          workflowId: CONFLICTING_NAME, //the child will attempt to use this id
          expire: 600,
          config: {
            maximumAttempts: 3, //try 3 times and give up
            maximumInterval: '1 second',
            backoffCoefficient: 1,
          },
        });
        expect(handle.workflowId).toBeDefined();
      }, 10_000);
    });
  });

  describe('Worker', () => {
    describe('create', () => {
      it('should create and run the workers', async () => {
        const worker = await Worker.create({
          connection,
          taskQueue: 'idempotency-world',
          workflow: workflows.example,
        });
        await worker.run();
        expect(worker).toBeDefined();

        const childWorker = await Worker.create({
          connection,
          taskQueue: 'idempotency-world',
          workflow: workflows.childExample,
        });
        await childWorker.run();
        expect(childWorker).toBeDefined();

        const fixableWorker = await Worker.create({
          connection,
          taskQueue: 'idempotency-world',
          workflow: workflows.fixableExample,
        });
        await fixableWorker.run();
        expect(fixableWorker).toBeDefined();
      }, 20_000);
    });
  });

  describe('WorkflowHandle', () => {
    describe('result', () => {
      it("should throw a 'DuplicateName' error and stop due to insufficient retries", async () => {
        try {
          const result = await handle.result();
          expect(result).toEqual(`Hello, HotMesh! Hello, HotMesh!`);
        } catch (error) {
          expect(error.message).toEqual(`Duplicate job: ${CONFLICTING_NAME}`);
        }
      }, 12_500);
    });
  });

  describe('End to End', () => {
    it("should throw a 'DuplicateName' error and then > retry, resolve (fix the name), succeed", async () => {
      const client = new Client({ connection });
      const badCount = 1;
      const handle = await client.workflow.start({
        args: [badCount],
        taskQueue: 'idempotency-world',
        workflowName: 'fixableExample',
        workflowId: `fixable-${CONFLICTING_NAME}`,
        expire: 600,
        config: {
          maximumAttempts: 3, //on try 3 it will be fixed and will succeed
          maximumInterval: '1 second',
          backoffCoefficient: 1,
        },
      });
      expect(handle.workflowId).toBe(`fixable-${CONFLICTING_NAME}`);
      const outcome = await handle.result<string>({ throwOnError: false });
      expect(outcome).toEqual('Hello, FIXED!');
    }, 20_000);
  });
});
