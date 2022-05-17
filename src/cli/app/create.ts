import { Arguments, CommandBuilder } from "yargs";
import pkg from "gitly";
import ora from "ora";
import { access } from 'fs/promises';
import { lookpath  } from "lookpath";
import chalk from "chalk";
import sanitize from "sanitize-filename";
import fs from 'fs-extra';

import { API, GET } from "../../lib/index.js";
import { StoreCreate } from "../../types.js";
import { run } from "../../lib/common.js";
import boxen from "boxen";
import { useEnvironment, useOrganization, useToken } from "../../middleware/index.js";

export const command = "create [name]";
export const desc = "Create a Saleor App template";

export const builder: CommandBuilder<Record<string, never>, StoreCreate> = (_) =>
  _.positional("name", { type: "string", demandOption: true, default: "my-saleor-app" })

export const handler = async (argv: Arguments<StoreCreate>): Promise<void> => {
  const env = await GET(API.Environment, argv) as any;
  const { download, extract } = pkg;
  const pnpm = await lookpath('pnpm');

  if (!pnpm) {
    console.log(chalk.red(`
✘ This Saleor App template uses the pnpm package manager. To install it, run:`));
    console.log(`  npm install -g pnpm`);
    process.exit(1);
  }

  const baseURL = `https://${env.domain}`;
  const dashboaardMsg = chalk.blue(`Dashboard - ${baseURL}/dashboard`);
  const gqlMsg = chalk.blue(`GraphQL Playgroud - ${baseURL}/graphql/`);
  console.log(boxen(`${dashboaardMsg}\n${gqlMsg}`, { padding: 1 }));

  const spinner = ora('Downloading...').start();
  const file = await download(`saleor/saleor-app-template`)

  spinner.text = 'Extracting...'
  const target = await getFolderName(sanitize(argv.name));
  await extract(file, target);

  process.chdir(target);
  spinner.text = `Creating .env...`;

  await fs.outputFile('.env', `
NEXT_PUBLIC_SALEOR_API_URL=${baseURL}/graphql/
APP_URL=
`)

  spinner.text = 'Installing dependencies...';
  await run('pnpm', ['i', '--ignore-scripts'], { cwd: process.cwd() })
  spinner.succeed('Starting ...\`pnpm run dev\`');

  await run('pnpm', ['run', 'dev'], { stdio: 'inherit', cwd: process.cwd() })
}

const getFolderName = async (name: string): Promise<string> => {
  let folderName = name;
  while (await dirExists(folderName)) {
    folderName = folderName.concat('-0');
  }
  return folderName
}

const dirExists = async (name: string): Promise<boolean> => {
  try {
    await access(name);
    return true
  } catch (error) {
    return false
  }
}

export const middlewares = [
  useToken, useOrganization, useEnvironment
]
