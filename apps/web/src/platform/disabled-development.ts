export async function loadDevelopmentContent(): Promise<never> {
  throw new Error("Development content is unavailable in installed mode");
}
export async function loadDevelopmentOpening(): Promise<never> {
  throw new Error("Development opening is unavailable in installed mode");
}
export async function loadDevelopmentPreparation(): Promise<never> {
  throw new Error("Development preparation is unavailable in installed mode");
}
