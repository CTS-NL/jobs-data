'use strict';

const {open} = require('sqlite');
const sqlite3 = require('sqlite3');

module.exports = async (databaseFile) => {
	const db = await open({
		filename: databaseFile,
		driver: sqlite3.Database
	});

	await db.exec(
		[
			'CREATE TABLE company (',
			'   id INTEGER PRIMARY KEY NOT NULL,',
			'   key TEXT UNIQUE NOT NULL,',
			"   name TEXT NOT NULL,",
			"   url TEXT NOT NULL,",
			"   remote NUMERIC NOT NULL,",
			"   local NUMERIC DEFAULT false,",
			"   canadian NUMERIC DEFAULT false",
			")"
		]
		.join('\n')
	);

	await db.exec(
		[
			'CREATE TABLE job_posting (',
			'   id INTEGER PRIMARY KEY NOT NULL,',
			"   company_id INTEGER NOT NULL,",
			"   post_date TEXT NOT NULL,",
			"   removed_date TEXT NOT NULL,",
			"   title TEXT NOT NULL,",
			"   url TEXT NOT NULL,",
			"   remote NUMERIC NOT NULL,",
			"   FOREIGN KEY(company_id) REFERENCES company(id)",
			")"
		]
		.join('\n')
	);
	await db.exec(
		[
			'CREATE TABLE job_posting_change (',
			'   id INTEGER PRIMARY KEY NOT NULL,',
			"   job_posting_id INTEGER NOT NULL,",
			"   update_at TEXT NOT NULL,",
			"   old_title TEXT NOT NULL,",
			"   new_title TEXT NOT NULL,",
			"   old_url TEXT NOT NULL,",
			"   new_url TEXT NOT NULL,",
			"   FOREIGN KEY(job_posting_id) REFERENCES job_posting(id)",
			")"
		]
		.join('\n')
	);
};
