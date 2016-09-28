const Db = require('mongodb').Db
const MongoClient = require('mongodb').MongoClient
const Server = require('mongodb').Server
const http = require('http')
const url = require('url')
const NodeCache = require('node-cache')

const queryFields = {
	single: { fields: { _id: 0 } },
	all: { fields: { id: 1, name: 1, _id: 0 } }
}
const cache = new NodeCache({ stdTTL: 10})
let time = new Date().getTime()

// Server
http.createServer(function (req, res) {
	let params = url.parse(req.url, true).query
	
	if (!params.q)
		return res.end('Chest REST')

	time = new Date().getTime()

	cache.get(params.q, function (err, value) {
		if (!err) {
			if (typeof value !== 'undefined') {
				console.log('Sending ' + params.q + ' from cache - time:', new Date().getTime() - time, 'ms')

				res.end(JSON.stringify(value))

				return
			}

			returnChests(res, params.q)
		}
	})
}).listen(8001)


function returnChests(res, key) {
	time = new Date().getTime()
	let fields = key !== 'all' ? queryFields.single : queryFields.all
	let query = key !== 'all' ? { id: ~~key } : {}

	console.log(fields, query);
	MongoClient.connect('mongodb://pwsimulator.com:27017/admin', function (err, db) {
		if (!err)
			db.collection('chests').find(query, fields).toArray(function (err, result) {
				if (!err) {
					console.log('Sending ' + key + ' from db - time:', new Date().getTime() - time, 'ms')

					cache.set(key, result, 300)
					res.end(JSON.stringify(result))					
				}
			})
	})
}