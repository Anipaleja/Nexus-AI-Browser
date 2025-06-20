const path = require('path');

module.exports = {
  target: 'electron-main',
  mode: process.env.NODE_ENV || 'development',
  entry: './src/main/main.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'main.js'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  externals: {
    'electron': 'commonjs2 electron',
    '@tensorflow/tfjs-node': 'commonjs2 @tensorflow/tfjs-node'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json']
  }
};

