import { MeshFlowFatalError } from '@hotmeshio/hotmesh/build/modules/errors';

export async function myFatalActivity(name: string): Promise<void> {
  throw new MeshFlowFatalError(`stop-retrying-please-${name}`);
}
