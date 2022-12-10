#!/usr/bin/env node

'use strict';

const {pathExists} = require('fs-extra');
const yargs = require('yargs');
const path = require('path');
const {syncCompanies, syncJobs, csvExport} = require('../lib/jobs');
const initDatabase = require('../lib/database');

const args = yargs
	.usage('Usage: cts [command]')
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
			await initDatabase(databaseFile);
		}
	)
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
		'csv <database> <csv-file>',
		'Export a CSV file of the job postings',
		(y) => {
			return y
				.positional('database', {
					description: 'Database file to write results.',
				})
				.positional('csv-file', {
					description: 'File to write CSV data to',
				});
		},
		async (argv) => {
			const csvFile = path.resolve(process.cwd(), argv.csvFile);
			const databaseFile = path.resolve(process.cwd(), argv.database);

			if (!await pathExists(databaseFile)) {
				console.error(`The database file, ${argv.database}, does not exist`);
				process.exitCode = 1;
				return;
			}

			await csvExport(databaseFile, csvFile);
		}
	)
	.demandCommand(1, 1, 'Please provide a command', 'Please provide a command')
	.help('h')
	.alias('h', 'help')
	.strict()
;

// eslint-disable-next-line no-unused-expressions
args.argv;
