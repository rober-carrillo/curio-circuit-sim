// Pure JavaScript endpoint – CommonJS (req, res)

module.exports = async function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify({
    status: 'ok',
    message: 'Ping successful!',
    timestamp: new Date().toISOString(),
  }));
};
