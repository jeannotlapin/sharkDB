var http = require('http');
var url = require('url');
var fs = require('fs');
var topojson = require("topojson");

var port = process.env.PORT || 1337;
http.createServer(function(proxyReq, proxyResp) {
	var urlValid = true;
	try {
	    var params = url.parse(proxyReq.url, true);
	} catch(e) {
		console.log("Invalid url "+url);
		urlValid = false;
	}

if (urlValid) {
	/* check query validity */
	if (params.query.outputFormat!='json' || params.query.request!='GetFeature' || params.query.typeName == '') {
		console.log("Invalid query");
		console.log(params.query);
		urlValid = false;
	} else {
		/* retrieve file from cache */
		var fileName = params.query.typeName;
		try {
			sendAnswer(fs.readFileSync('cache/'+fileName));
		} catch(e) {
			/* file is not in cache : download it from FAO server and put it in a buffer */
			console.log(fileName+" not in cache");
			var reqOptions = {
				hostname : 'www.fao.org',
				port : 80,
				path : '/'+params.search.substr(1),
				method : "GET"
			};

			var req = http.request(reqOptions, function(res) {
				var inputBuffer = new String();
				res.on('data', function(chunk) {
					inputBuffer = inputBuffer.concat(chunk);
				});

				res.on('end', function() {
					convert2Topojson(JSON.parse(inputBuffer));
				});
			});

			req.on('error', function(e) {
				console.log('problem with request: ' + e.message);
				proxyResp.writeHead(503);
				proxyResp.write("An error happened!");
				proxyResp.end();
			});
			req.end();
		}
	}
} else {
        proxyResp.writeHead(503);
        proxyResp.write("An error happened!");
        proxyResp.end();
}

function sendAnswer(content) {
        proxyResp.writeHead(200, {
		'Content-Type' : 'application/json',
		'Connection' : 'Keep-Alive',
		'Keep-Alive' : 'timeout=5, max=100',
		'Access-Control-Allow-Origin' : '*',
		'Access-Control-Allow-Headers' : 'X-Requested-With',
		'Content-Length' : content.length
	});

	proxyResp.write(content);
        proxyResp.end();
}

/* convert the geojson input buffer into a topojson, save it in cache and send it as query response */
function convert2Topojson(inputBuffer) {
	function propertyTransform(d) {
		return d.properties;
	}

	var optionsTopojson = { verbose: true,
		'pre-quantization': 1000000,
		'post-quantization': 10000,
		'coordinate-system': 'auto',
		'stitch-poles': false,
		'property-transform': propertyTransform,
		'minimum-area': 0,
		'preserve-attached': true,
		'retain-proportion': 0,
		'force-clockwise': true};

	/* convert the geojson to topojson */
	var topology = topojson.topology(
			{marineAreas : inputBuffer},
			optionsTopojson
		);
	topojson.prune(topology, optionsTopojson);

	topojson.clockwise(topology, optionsTopojson);

	var topojsonBuffer = JSON.stringify(topology);
	sendAnswer(topojsonBuffer); /* send it as answer */
	fs.writeFile('cache/'+fileName, topojsonBuffer, "utf-8"); /* write it to file */
}

}).listen(port, 'figisproxy.npasc.al');
