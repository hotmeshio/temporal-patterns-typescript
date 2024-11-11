import { workflow } from '@hotmeshio/hotmesh';

import * as activities from './activities';

const { childActivity } = workflow.proxyActivities<typeof activities>({
  activities,
});

export async function childExample(name: string): Promise<string> {
  return await childActivity(name);
}
