import osmosis from 'osmosis';
import json2csv from 'json2csv';
import fs from 'fs';
const routes = app => {
	app.get('/', (req,res) => {
		res.send('Hello world!');
	});

	app.get('/scrape', (req,res) => {
		let dataArr = [];
		const uniqueCache = {};
		let completedScrapes = 0;

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
		]

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
				const csvFields = ['title', 'date', 'authors', 'content'];

				const csv = json2csv({ data: dataArr, fields: csvFields });
 
				fs.writeFile('argus_civil_engagement.csv', csv, (err) => {
				  if (err) throw err;
				  console.log(`File saved for "${search.keyWord}"`);
				  completedScrapes++;
				  if (completedScrapes === searches.length) {
				  	console.log('Done');
				  	res.send('CSV saved!');
				  }
				});
			});
		})
		
	});
};

export default routes;