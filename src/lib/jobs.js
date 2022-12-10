'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');
const {open} = require('sqlite');
const sqlite3 = require('sqlite3');
const moment = require('moment');
const {stringify} = require('csv-stringify/sync');

sqlite3.verbose();

async function init(dataFile, databaseFile) {
	const db = await open({
		filename: databaseFile,
		driver: sqlite3.Database
	});

	if (!await fs.pathExists(dataFile)) {
		console.error(`The provided data file does not exist: ${dataFile}`);
		process.exitCode = 1;
		return;
	}

	const data = yaml.safeLoad(await fs.readFile(dataFile));

	return {db, data};
}

function companyDataToQueryObj(key, company) {
	return {
		':key': key,
		':name': company.name,
		':url': company.url,
		':remote': company.local === true ? 'true' : 'false',
		':local': company.local === true ? 'true' : 'false',
		':canadian': company.local === true ? 'true' : 'false',
	};
}

async function findExistingCompany(db, key) {
	return db.get(
		[
			'SELECT',
			"   *",
			"FROM company",
			"WHERE 1=1",
			"AND company.key = :key",
		].join("\n"),
		{
			':key': key,
		}
	);
}

async function insertCompany(db, key, company) {
	return db.run(
		[
			'INSERT INTO company (key, name, url, remote, local, canadian)',
			'VALUES (:key, :name, :url, :remote, :local, :canadian)',
		].join("\n"),
		companyDataToQueryObj(key, company)
	);
}

async function updateExistingCompany(db, key, company) {
	return db.run(
		[
			'UPDATE company SET',
			'   name = :name,',
			'   url = :url,',
			'   remote = :remote,',
			'   local = :local,',
			'   canadian = :canadian',
			"WHERE key = :key",
		].join("\n"),
		companyDataToQueryObj(key, company)
	);
}

let linkUniqueCounter = 0;
let sharedUrls = [
	'https://www.zambara.net/team',
	'https://www.colabsoftware.com/careers',
	'http://www.smartice.org/jobs/',
	'https://www.avalonholographics.com/careers',
	'https://www.bluedriver.com/about-us/careers',
	'https://www.bullseyebranding.ca/opportunities/',
	'https://www.compusult.com/web/guest/careers',
	'https://www.sequencebio.com/careers',
	'https://www.virtualmarine.ca/careers',
	'https://us.bluedriver.com/pages/careers',
	'https://strobeltek.com/careers/',
	'https://verafin.com/careers/',
	'http://radient360.com/r360careers/',
]

function getLink(posting) {
	if (sharedUrls.includes(posting.link)) {
		return `${posting.link}#${new Date(Date.now()).toISOString()}${linkUniqueCounter++}`;
	}
	if (posting.link === undefined) {
		console.error('No link for posting:', posting);
		process.exit(1);
		return;
	}
	return posting.link;
}


function postingDataToQueryObj(company, post_date, posting) {
	const posted_date =  moment.utc(post_date);
	return {
		':companyId': company.id,
		':postDate': posted_date.toISOString(),
		':removedDate': posted_date.add('1', 'week').toISOString(),
		':title': posting.title,
		':url': posting.link,
		':remote': posting.remote === true ? 'true' : 'false',
	};
}


async function findExistingPosting(db, company_key, post_date, posting) {
	const link = getLink(posting);
	const posted_date =  moment.utc(post_date).toISOString();
	let query = [
		'SELECT',
		"   job_posting.*",
		"FROM job_posting",
		"JOIN company ON company.id = job_posting.company_id",
		"WHERE 1=1",
		"AND company.key = :company_key",
		"AND (",
		"  (job_posting.url = :url AND job_posting.title = :title)",
		"  OR (job_posting.post_date = :date AND job_posting.url = :url)",
		"  OR (job_posting.post_date = :date AND job_posting.title = :title)",
		")"
	].join("\n");

	const existing = await db.get(
		query,
		{
			':url': link,
			':company_key': company_key,
			':title': posting.title,
			':date': posted_date,
		}
	);

	if (existing && existing.post_date === posted_date && existing.url === link && existing.title !== posting.title) {
		console.log('Possible Shared: ', link);
	}

	return existing;
}

async function insertNewPosting(db, company, post_date, posting) {
	return db.run(
		[
			'INSERT INTO job_posting (company_id, post_date, removed_date, title, url, remote)',
			'VALUES (:companyId, :postDate, :removedDate, :title, :url, :remote)',
		].join("\n"),
		postingDataToQueryObj(company, post_date, posting)
	);
}

async function insertPostingChange(db, date, existing, posting) {
	return db.run(
		[
			'INSERT INTO job_posting_change (job_posting_id, update_at, old_title, new_title, old_url, new_url)',
			'VALUES (:jobPostingId, :updateAt, :oldTitle, :newTitle, :oldUrl, :newUrl)',
		].join("\n"),
		{
			':updateAt': date,
			':jobPostingId': existing.id,
			':oldTitle': existing.title,
			':newTitle': posting.title,
			':oldUrl': existing.url,
			':newUrl': posting.link,
		}
	);
}

async function updatePosting(db, id, company, post_date, posting_date, posting) {
	return db.run(
		[
			'UPDATE job_posting SET',
			'   company_id = :companyId,',
			'   post_date = :postDate,',
			'   removed_date = :removedDate,',
			'   title = :title,',
			'   url = :url,',
			'   remote = :remote',
			"WHERE id = :id",
		].join("\n"),
		{
			':id': id,
			...postingDataToQueryObj(company, post_date, posting),
			':removedDate': moment(posting_date).add(1, 'week').toISOString(),
		}
	);
}

module.exports = {};

module.exports.syncCompanies = async (dataFile, databaseFile) => {
	const {db, data} = await init(dataFile, databaseFile);

	for (const key in data) {
		let existing = await findExistingCompany(db, key);

		const company = data[key];

		if (existing !== undefined) {
			console.log(`Updating: ${key}`);
			await updateExistingCompany(db, key, company);
		}
		else {
			console.log(`Inserting: ${key}`);
			await insertCompany(db, key, company);
		}
	}
};

module.exports.syncJobs = async (dataFile, databaseFile) => {
	const {db, data} = await init(dataFile, databaseFile);

	const startCount = await db.get("SELECT COUNT(id) as total FROM job_posting");

	let posting_date = moment.utc('2000-01-01T00:00:00Z');
	for (const companyPostings of data) {
		for (const jobPostings of companyPostings.jobs) {
			let post_time = moment.utc(jobPostings.post_date);
			if (post_time > posting_date) {
				posting_date = post_time;
			}
		}
	}

	console.log(`Updating posts for: ${posting_date}`);

	let updateCounter = 0;
	for (const companyPostings of data) {
		const company = await findExistingCompany(db, companyPostings.company);

		if (company === undefined) {
			console.error(`No company record for: ${companyPostings.company}`);
			process.exitCode = 1;
			return;
		}

		for (const jobPostings of companyPostings.jobs) {
			for (const posting of jobPostings.jobs) {
				if (posting.indeed) {
					posting.link = `https://ca.indeed.com/viewjob?jk=${posting.indeed}`;
				}
				posting.company_id = company.id;
				posting.post_date = jobPostings.post_date;
				const existing = await findExistingPosting(db, companyPostings.company, jobPostings.post_date, posting);
				if (existing !== undefined) {
					if (existing.title !== posting.title || existing.url !== posting.link) {
						await insertPostingChange(db, posting_date, existing, posting);
						updateCounter += 1;
					}
					await updatePosting(db, existing.id, company, existing.post_date, posting_date, posting);
				}
				else {
					await insertNewPosting(db, company, jobPostings.post_date, posting);
				}
			}
		}
	}
	const endCount = await db.get("SELECT COUNT(id) AS total FROM job_posting");

	console.log(`${updateCounter} postings updated. ${endCount.total - startCount.total} added for a total of ${endCount.total}`);
};

module.exports.csvExport = async (databaseFile, csvFile) => {
	const db = await open({
		filename: databaseFile,
		driver: sqlite3.Database
	});

	if (!await fs.pathExists(csvFile)) {
		console.error(`The provided data file does not exist: ${csvFile}`);
		process.exitCode = 1;
		return;
	}

	let data = [[
		"CompanyKey", "CompanyName", "IsCompanyRemote", "IsCompanyLocal", "IsCompanyCanadian", "PostDate", "RemovedDate", "JobTitle", "JobUrl", "IsRemote"
	]];

	let dbData = await db.all([
		"SELECT",
		"  c.key as CompanyKey,",
		"  c.name as CompanyName,",
		"  c.remote as IsCompanyRemote,",
		"  c.local as IsCompanyLocal,",
		"  c.canadian as IsCompanyCanadian,",
		"  j.post_date as PostDate,",
		"  j.removed_date as RemovedDate,",
		"  j.title as JobTitle,",
		"  j.url as JobUrl,",
		"  j.remote as IsRemote",
		"FROM job_posting j",
		"JOIN company c on c.id = j.company_id",
	].join("\n"));

	for (const record of dbData) {
		data.push([
			record.CompanyKey,
			record.CompanyName,
			record.IsCompanyRemote,
			record.IsCompanyLocal,
			record.IsCompanyCanadian,
			record.PostDate,
			record.RemovedDate,
			record.JobTitle,
			record.JobUrl,
			record.IsRemote,
		])
	}
	const output = stringify(data);

	await fs.writeFile(csvFile, output);

	console.log("CSV file written");
}
