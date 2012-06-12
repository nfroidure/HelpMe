var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
var qs= require('querystring');
var server='192.168.1.32';
var port='1337';
var users=new Array(
	{'username':'rlal','name':'Lal','lastname':'Rocky','phone':'447866195361','languages':new Array('pn','en'),'skills':new Array('health','security','household','off-licence-owner')},
	{'username':'nfroidure','name':'Froidure','lastname':'Nicolas','phone':'33643890708','languages':new Array('fr','en'),'skills':new Array('health','security','household')},
	{'name':'jpicaud','name':'Picaud','lastname':'Julien','phone':'33687506383','languages':new Array('fr','en'),'skills':new Array('health','security','household','directions')}
	);
var helps=new Array();
http.createServer(function (request, response) 
	{
	var requestBody='';
	request.on('data', function (chunk)
		{
		requestBody+=chunk;
		});
	request.on('end', function (chunk)
		{
		var url_parts = url.parse(request.url, true);
		var requestQuery = url_parts.query;
		if(request.method=='POST')
			{
			var decodedBody = qs.parse(requestBody);
			console.log(JSON.stringify(decodedBody));
			}
		var filePath = request.url;
		if (filePath == '/')
			{
			filePath = '/www/index.html';
			response.writeHead(301, { 'Location': filePath });
			response.end();
			return;
			}
		filePath = './helpme'+filePath;
		console.log('request starting:'+filePath);
		if(filePath.indexOf('./helpme/www')===0) // Serving files
			{
			path.exists(filePath, function(exists)
				{
				if (exists)
					{
					fs.readFile(filePath, function(error, content)
						{
						if (error)
							{
							response.writeHead(500);
							response.end();
							}
						else
							{
							response.writeHead(200, { 'Content-Type': 'text/html' });
							response.end(content, 'utf-8');
							}
						});
					}
				else
					{
					response.writeHead(404);
					response.end();
					}
				});
			}
		else if(filePath.indexOf('./helpme/users')===0) // Send SMS
			{
			response.writeHead(200, { 'Content-Type': 'application/json' });
			response.end(JSON.stringify(users), 'utf-8');
			}
		else if(filePath.indexOf('./app.manifest')===0) // Send SMS
			{
			response.writeHead(200, { 'Content-Type': 'text/cache-manifest' });
			response.end('CACHE MANIFEST'+"\n"
				+'# 2012-06-09 v1.0.0'+"\n"
				+'/www/html5.css'+"\n"
				+'/www/register.html'+"\n"
				+'/www/sent.html'+"\n"
				+'/www/oops.html'+"\n"
				+'/www/index.html', 'utf-8');
			}
		else if(filePath.indexOf('./helpme/help')===0) // Send SMS
			{
			console.log('# New help request');
			var id=users.length,i;
			for(i=id-1; i>=0; i--)
				{
				if(users[i].skills.indexOf(decodedBody.request)!==false)	
					{
					id=i; break;
					}
				}
			if(i==0)
				{
				filePath = '/www/oops.html';
				response.writeHead(301, { 'Location': filePath });
				}
			else
				{
				var options = {
					host: 'run.orangeapi.com',
					port: 80,
					path: '/sms/sendSMS.xml?id=ed25ccbf409&from=20345&to=33687506383&content='+encodeURIComponent((decodedBody.message?decodedBody.message:'Need help')+' https://maps.google.com/maps?hl=en&ll='+decodedBody.lat+','+decodedBody.lng+'&spn=0.008836,0.026157&t=m&z=16')+'&long_text=true&max_sms=10&ack=false&content_encoding=ucs2&session=&session_duration=&tag=',
					method: 'POST',
					headers: {'Content-Length':'0'}
					};
				console.log('Orange API access : '+options.path);
				var req = http.request(options, function(res)
					{
					console.log('STATUS: ' + res.statusCode);
					console.log('HEADERS: ' + JSON.stringify(res.headers));
					var body='';
					res.setEncoding('utf8');
					res.on('data', function (chunk)
						{
						body+=chunk;
						});
					res.on('end', function (chunk)
						{
						console.log('BODY: '+body);
						});
					filePath = '/www/sent.html';
					response.writeHead(301, { 'Location': filePath });
					response.end();
					});

				req.on('error', function(e)
					{
					console.log('problem with request: ' + e.message);
					});
				req.write('');
				req.end();
				}
			}
		else if(filePath.indexOf('./helpme/register')===0) // Send Geolocation authorization
			{
			console.log('# New register request');
			var id=users.length;
			for(var i=id-1; i>=0; i--)
				{
				if(users[i].username==decodedBody.username)	
					{
					id=i; break;
					}
				}
			users[id]={'username':decodedBody.username,'name':(decodedBody.name?decodedBody.name:''),'lastname':(decodedBody.lastname?decodedBody.lastname:''),'phone':decodedBody.phone,'languages':new Array('pn','en'),'skills':new Array('health','security','household','off-licence-owner')};
			console.log(users);
			var options = {
				host: 'run.orangeapi.com',
				port: 80,
				path: '/location/createAuthorization.xml?id=ed25ccbf409&number=33643890708&tag=',
				method: 'POST',
				headers: {'Content-Length':'0'}
				};
			console.log('Orange API access : '+options.path);
			var req = http.request(options, function(res)
				{
				console.log('STATUS: ' + res.statusCode);
				console.log('HEADERS: ' + JSON.stringify(res.headers));
				filePath = '/www/index.html';
				response.writeHead(301, { 'Location': filePath });
				response.end();
				});
			req.on('error', function(e) 
				{
				console.log('problem with request: ' + e.message);
				});
			req.write('');
			req.end();
			}
		else // No action for this uri
			{
			response.writeHead(404);
			response.write('unknown');
			response.end();
			}
		});
	}).listen(port);


setTimeout(function()
		{
		console.log('# Getting geolocations');
		for(var i=users.length-1; i>=0; i--)
			{
			console.log('## User : '+users[i].name);
			var options = {
				host: 'run.orangeapi.com',
				port: 80,
				path: '/location/getLocation.xml?id=ed25ccbf409&number='+users[i].phone+'&tag=',
				method: 'POST',
				headers: {'Content-Length':'0'}
				};
			console.log('Orange API access : '+options.path);
			var req = http.request(options, function(res) 
				{
				console.log('STATUS: ' + res.statusCode);
				console.log('HEADERS: ' + JSON.stringify(res.headers));
				res.setEncoding('utf8');
				res.on('data', function (chunk) 
					{
					console.log('BODY: ' + chunk);
					});
				});
			req.on('error', function(e) 
				{
				console.log('problem with request: ' + e.message);
				});
			req.write('');
			req.end();
			}
		},0);
 
console.log('Server running at http://'+server+':'+port+'/');
