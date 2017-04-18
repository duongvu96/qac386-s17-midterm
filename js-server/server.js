import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import routes from './app/routes';

const app = express();
const port = 3000;

app.use(bodyParser.json()); 
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(methodOverride('X-HTTP-Method-Override')); 

//Shorten paths for front-end use
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/app')); // redirect custom front-end script
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap


app.use(express.static(__dirname + '/public')); 

app.set('view engine', 'ejs');

routes(app);

app.listen(port, () => {
	console.log(`App running on port: ${port}`);
});