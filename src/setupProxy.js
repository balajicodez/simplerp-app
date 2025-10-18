const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to backend (change target if your API runs elsewhere)
  app.use(
    ['/employees', '/jobs', '/some-other-api'],
    createProxyMiddleware({
      target: 'http://localhost:9090',
      changeOrigin: true,
      secure: false,
    })
  );
};
