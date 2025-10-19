const path = require('path');

module.exports = {
  entry: {
    'bundle-clerk': './src/clerk-bundle.js',
    'clerk-auth': './src/clerk-auth-main.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'js'),
    clean: false
  },
  resolve: {
    extensions: ['.js']
  },
  mode: 'production',
  devtool: false
};
