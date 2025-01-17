import { CliUx } from '@oclif/core';
import chalk from 'chalk';
import { Arguments, CommandBuilder } from 'yargs';

import { API, GET } from "../../lib/index.js";
import { formatDateTime } from '../../lib/util.js';

const { ux: cli } = CliUx;

export const command = "list";
export const desc = "List environments";

export const builder: CommandBuilder = (_) =>
  _.option("extended", {
    type: 'boolean',
    default: false,
    desc: 'show extended table',
  })

export const handler = async (argv: Arguments) => {
  const { extended } = argv;
  const result = await GET(API.Environment, { ...argv, environment: '' }) as any[];

  // const production = result.filter(({service}) => service.service_type === "SANDBOX")

  if (!result.length) {
    console.warn(chalk.red(" No environments found for this organization"))
    process.exit(0);
  }

  cli.table(result, {
    name: { minWidth: 2, get: ({ name }) => chalk.cyan(name) },
    created: { minWidth: 2, get: ({ created }) => chalk.gray(formatDateTime(created)) },
    project: { minWidth: 2, get: _ => _.project.name },
    service: { minWidth: 2, header: 'Ver.', get: _ => chalk.yellow(_.service.version) },
    key: { minWidth: 2 },
    domain: { minWidth: 2, get: ({ domain }) => domain, extended: true },
    service_type: { minWidth: 2, get: ({ service }) => service.service_type },
  },
  {
    extended: extended as boolean
  });

  process.exit(0);
};
