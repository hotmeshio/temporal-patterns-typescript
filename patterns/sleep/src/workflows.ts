import { workflow } from '@hotmeshio/hotmesh';

import * as activities from './activities';
import type greetFunctionType from './activities';
type ActivitiesType = {
  greet: typeof greetFunctionType;
};

const { greet } = workflow.proxyActivities<ActivitiesType>({
  activities,
});

export async function example(name: string): Promise<string> {
  //run a proxy activity
  const yo = await greet(name);

  //ALWAYS use workflow.sleepFor as its deterministic
  await workflow.sleepFor('1 seconds');

  //sleep for 2 more
  await workflow.sleepFor('2 seconds');

  return yo;
}
