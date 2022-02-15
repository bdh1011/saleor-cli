import type { CancelableRequest } from "got";
import got from "got";

import { Config } from "./config.js";

const CloudURL = `https://staging-cloud.saleor.io/api`;

const BaseOptions = {
  prefixUrl: CloudURL,
};

interface PathArgs {
  organization_slug: string
  environment_id?: string
  project_slug?: string
}
type DefaultURLPath = (_: PathArgs) => string;

const handleAuthAndConfig = (func: Function) => async (pathFunc: DefaultURLPath, options: any = {}) => {
  const config = await Config.get();
  
  const {
    token = config.token,
    organization_slug = config.organization_slug || '',
    environment_id = config.environment_id || '',
    ...httpOptions
  } = { ...options }

  if (!token) {
    console.error("Missing the auth token: Please create token and run `saleor configure`");
    throw Error("No auth token")
  }

  const path = pathFunc({ environment_id, organization_slug });

  return func(path, { 
    headers: {
      Authorization: `Token ${token}`,
    },
    ...httpOptions
  }) as CancelableRequest;
}

const doGETRequest = (path: string, options?: any) => got(path, {...options, ...BaseOptions}).json();
const doPOSTRequest = (path: string, options?: any) => got.post(path, {...options, ...BaseOptions}).json()
const doDELETERequst = (path: string, options: any) => got.delete(path, {...options, ...BaseOptions}).json();

export const GET = handleAuthAndConfig(doGETRequest);
export const POST =  handleAuthAndConfig(doPOSTRequest);
export const DELETE = handleAuthAndConfig(doDELETERequst);

export const API: Record<string, DefaultURLPath> = {
  User: _ => "user",
  Organization: _ => `organizations/${_.organization_slug}`,
  Environment: _ => `organizations/${_.organization_slug}/environments/${_.environment_id}`,
  PopulateDatabase: _ => `organizations/${_.organization_slug}/environments/${_.environment_id}/populate-database`,
  ClearDatabase: _ => `organizations/${_.organization_slug}/environments/${_.environment_id}/clear-database`,
  Job: _ => `organizations/${_.organization_slug}/environments/${_.environment_id}/jobs`,
  Backup: _ => `organizations/${_.organization_slug}/environments/${_.environment_id}/backups`,
  Project: _ => `organizations/${_.organization_slug}/projects/${_.project_slug}`,
}
