// NOTE: `default` function exports must be typed/handled properly by workflow that imports them
//       Refer to the ./workflows.ts file for how default exports are handled
export default async function greet(
  name: string,
): Promise<{ complex: string }> {
  return { complex: `Everything, ${name}!` };
}
