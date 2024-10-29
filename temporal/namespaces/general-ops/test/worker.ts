import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { config } from '../../../config';
import { connection } from '../../../connection';

class TemporalWorker {
  connection: NativeConnection;
  taskQueue: string;
  worker: Worker;

  constructor(taskQueue: string = config.taskQueue) {
    this.taskQueue = taskQueue;
  }

  async connect() {
    try {
      this.connection = await NativeConnection.connect(connection.connection);

      this.worker = await Worker.create({
        connection: this.connection,
        workflowsPath: require.resolve('./workflows'),
        activities,
        taskQueue: this.taskQueue,
        namespace: connection.namespace,
      });

      console.log(`Worker connected to Temporal server.`);
      await this.worker.run();
    } catch (err) {
      console.error('Failed to start the Temporal worker:', err);
      process.exit(1);
    }
  }

  async shutdown() {
    this.worker.shutdown();
    console.log('[nestedWorker] stopped gracefully');
  }
}

const temporalWorker = new TemporalWorker();
export { temporalWorker };
