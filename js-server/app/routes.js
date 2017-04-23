import osmosis from 'osmosis';

// I/O stuff
import json2csv from 'json2csv';
import csvtojson from 'csvtojson';
import jsonfile from 'jsonfile';
import fs from 'fs';

// nlp stuff
import lda from 'lda';
import keywords from 'retext-keywords';
import retext from 'retext';
import nlcstToString from 'nlcst-to-string';

const routes = app => {
	app.get('/', (req,res) => {
		res.send('Hello world!');
	});

	app.get('/scrape', (req,res) => {
		console.log('Scraping running...');

		let dataArr = [];
		const uniqueCache = {};
		let completedCSV = 0;
		let completedJSON = 0;

		const searches = [
			{
				url: 'http://wesleyanargus.com/page/1/?s=civic+engagement',
				keyWord: 'civic engagement',
				pages: 4
			},
			{
				url: 'http://wesleyanargus.com/page/1/?s=town+gown',
				keyWord: 'town gown',
				pages: 5
			},
			{
				url: 'http://wesleyanargus.com/page/1/?s=community+engagement',
				keyWord: 'community engagement',
				pages: 19
			}
		];

		searches.forEach(search => {
			osmosis
			.get(search.url)
			.paginate('.row.content.article .article-text.article-header:last a:last', search.pages)
			.find('.row.content.article .article-text section h2 a')
			.follow('@href')
			.find('.row.content.article .col-md-9')
			.set({
				'title': '.relative .article-text.article-header:first h1 a',
				'date': '.relative .article-text.article-header:first h4 time@datetime',
				'authors': '.relative .article-text.article-header:first h4 a',
				'content': '.relative + .article-text:first'
			})
			.data(function(data) {
				if (!uniqueCache[data.title]) {
					uniqueCache[data.title] = true;
					data.content = data.content.replace(/\n/g, ' ');
					dataArr.push(data);
					dataArr = dataArr.sort((article1, article2) => {
						const date1 = new Date(article1.date);
						const date2 = new Date(article2.date);
						return date1.getTime() - date2.getTime();
					});
				}
			})
			.done(() => {
				jsonfile.writeFile('argus_civil_engagement.csv', dataArr, (err) => {
					if (err) return console.log(err);
					console.log(`JSON file saved for "${search.keyWord}"`);

					completedJSON++;
					if (completedJSON === searches.length) {
						console.log('Done writing JSON');
					}
				});

				const csvFields = ['title', 'date', 'authors', 'content'];
				const csv = json2csv({ data: dataArr, fields: csvFields });
				fs.writeFile('argus_civil_engagement.csv', csv, (err) => {
				  	if (err) return console.log(err);
				  	console.log(`CSV file saved for "${search.keyWord}"`);
				  	completedCSV++;
				  	
				  	if (completedCSV === searches.length) {
						console.log('Done writing CSV');
						res.send('DONE!');
					}
				});
			});
		});
	});

	app.get('/lda', (req,res) => {
		console.log('LDA running...');
		let articles;
		jsonfile.readFile('argus_civil_engagement.json', (err, obj) => {
			if (err) {
				res.send('No data to run LDA on');
				return console.log(err);
			}

			articles = obj.map((article) => {
				return {
					title: article.title,
					content: article.content
				};
			});

			// LDA
			const articlesLDA = articles.map((article) => {
				const documents = article.content.match( /[^\.!\?]+[\.!\?]+/g);
				return {
					[article.title]: lda(documents, 2, 5)
				};
			});

			jsonfile.writeFile('public/lda.json', articlesLDA, (err) => {
				if (err) return console.log(err);
				console.log('JSON file saved for LDA');
			});

			// Key phrases extraction
			const articlesKeyPhrases = articles.map((article) => {
				const keyPhrases = [];
				retext().use(keywords).process(article.content.toLowerCase(), (err, file) => {
					file.data.keyphrases.forEach((phrase) => {
						keyPhrases.push(phrase.matches[0].nodes.map(nlcstToString).join(''));
					});
				});
				return {
					[article.title]: keyPhrases
				};
			});

			jsonfile.writeFile('public/keyphrases.json', articlesKeyPhrases, (err) => {
				if (err) return console.log(err);
				console.log('JSON file saved for key phrases');
			});

			res.send('Success?');
		});
	});

	app.get('/keyphrases', (req, res) => {
		console.log('Key phrases extraction running...');
		let articles;
		jsonfile.readFile('argus_civil_engagement.json', (err, obj) => {
			if (err) {
				res.send('No data to run LDA on');
				return console.log(err);
			}

			articles = obj.map((article) => {
				return {
					title: article.title,
					content: article.content
				};
			});

			// Key phrases extraction
			const allKeyPhrasesArr = []
			const articlesKeyPhrases = articles.map((article) => {
				const keyPhrases = [];
				retext().use(keywords).process(article.content.toLowerCase(), (err, file) => {
					file.data.keyphrases.forEach((phrase) => {
						const extractedPhrase = phrase.matches[0].nodes.map(nlcstToString).join('');
						keyPhrases.push(extractedPhrase);
						allKeyPhrasesArr.push({phrase: extractedPhrase});
					});
				});
				return {
					[article.title]: keyPhrases
				};
			});

			const csvFields = ['phrase'];
			const csv = json2csv({ data: allKeyPhrasesArr, fields: csvFields });
			fs.writeFile('public/argus_all_key_phrases.csv', csv, (err) => {
			  	if (err) return console.log(err);
			  	console.log('Done writing CSV');
			});

			// jsonfile.writeFile('public/keyphrases.json', articlesKeyPhrases, (err) => {
			// 	if (err) return console.log(err);
			// 	console.log('JSON file saved for key phrases');
			// })

			res.send('Success?');
		});
	});

	app.get('/group-csv-to-json', (req, res) => {
		const responseArr = []
		csvtojson()
			.fromFile('public/group_responses.csv')
			.on('json',(jsonObj)=>{
				responseArr.push(jsonObj);
			})
			.on('done',(err)=>{
				if (err) console.log(err);
				res.send('Done converting to JSON!');
				const answers = responseArr.map(row => {
					return row.Answer1;
				});

				const allKeyPhrasesArr = [];
				answers.forEach((answer) => {
					retext().use(keywords).process(answer.toLowerCase(), (err, file) => {
						file.data.keyphrases.forEach((phrase) => {
							const extractedPhrase = phrase.matches[0].nodes.map(nlcstToString).join('');
							allKeyPhrasesArr.push({phrase: extractedPhrase});
						});
					});
				});

				const csvFields = ['phrase'];
				const csv = json2csv({ data: allKeyPhrasesArr, fields: csvFields });
				fs.writeFile('public/group_responses_all_key_phrases.csv', csv, (err) => {
				  	if (err) return console.log(err);
				  	console.log('Done writing CSV');
				});
			});
	});
};

export default routes;