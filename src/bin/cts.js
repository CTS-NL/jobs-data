#!/usr/bin/env node

'use strict';

const {pathExists} = require('fs-extra');
const yargs = require('yargs');
const path = require('path');
const {syncCompanies, syncJobs} = require('../lib/sync-new-jobs');
const initDatabase = require('../lib/database');

const args = yargs
	.usage('Usage: cts [command]')
	.command(
		'companies <data-file> <database>',
		'Parse and save company data to a SQLite database',
		(y) => {
			return y
				.positional('data-file', {
					description: 'File containing the company data',
				})
				.positional('database', {
					description: 'Database file to write results.',
				});
		},
		async (argv) => {
			const dataFile = path.resolve(process.cwd(), argv.dataFile);

			if (!await pathExists(dataFile)) {
				console.error(`The data file, ${argv.dataFile}, does not exist`);
				process.exitCode = 1;
				return;
			}

			const databaseFile = path.resolve(process.cwd(), argv.database);

			if (!await pathExists(databaseFile)) {
				console.error(`The database file, ${argv.database}, does not exist`);
				process.exitCode = 1;
				return;
			}

			await syncCompanies(dataFile, databaseFile);
		}
	)
	.command(
		'jobs <data-file> <database>',
		'Parse and save job data to a SQLite database',
		(y) => {
			return y
				.positional('data-file', {
					description: 'File containing the job data',
				})
				.positional('database', {
					description: 'Database file to write results.',
				});
		},
		async (argv) => {
			const dataFile = path.resolve(process.cwd(), argv.dataFile);

			if (!await pathExists(dataFile)) {
				console.error(`The data file, ${argv.dataFile}, does not exist`);
				process.exitCode = 1;
				return;
			}

			const databaseFile = path.resolve(process.cwd(), argv.database);

			if (!await pathExists(databaseFile)) {
				console.error(`The database file, ${argv.database}, does not exist`);
				process.exitCode = 1;
				return;
			}

			await syncJobs(dataFile, databaseFile);
		}
	)
	.command(
		'init <database>',
		'Create the SQLite schema',
		(y) => {
			return y
				.positional('database', {
					description: 'Database file to write results.',
				});
		},
		async (argv) => {
			const databaseFile = path.resolve(process.cwd(), argv.database);

			if (!await pathExists(databaseFile)) {
				console.error(`The database file, ${argv.databse}, does not exist`);
				process.exitCode = 1;
				return;
			}

			await initDatabase(databaseFile);
		}
	)
	.demandCommand(1, 1, 'Please provide a command', 'Please provide a command')
	.help('h')
	.alias('h', 'help')
	.strict()
;

// eslint-disable-next-line no-unused-expressions
args.argv;
