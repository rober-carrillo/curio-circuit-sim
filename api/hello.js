// Simple test – CommonJS (req, res)

module.exports = function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify({ hello: 'world' }));
};
