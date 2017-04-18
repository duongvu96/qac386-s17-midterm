import osmosis from 'osmosis';
import json2csv from 'json2csv';
import fs from 'fs';
const routes = app => {
	app.get('/', (req,res) => {
		res.send('Hello world!');
	});

	app.get('/scrape', (req,res) => {
		let dataArr = [];
		osmosis
			.get('http://wesleyanargus.com/page/1/?s=civic+engagement')
			.paginate('.row.content.article .article-text.article-header:last a:last', 4)
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
				data.content = data.content.replace(/\n/g, ' ');
				dataArr.push(data);
				dataArr = dataArr.sort((article1, article2) => {
					const date1 = new Date(article1.date);
					const date2 = new Date(article2.date);
					return date1.getTime() - date2.getTime();
				});
				const csvFields = ['title', 'date', 'authors', 'content'];

				const csv = json2csv({ data: dataArr, fields: csvFields });
 
				fs.writeFile('argus_civil_engagement.csv', csv, (err) => {
				  if (err) throw err;
				  console.log('File saved');
				});
			})
			.then(() => {
				res.end();
			});
	});
};

export default routes;