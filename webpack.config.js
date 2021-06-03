const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devServer: {
    host: '0.0.0.0',
    https: true,
    proxy: {
      '/models': {
        target: 'http://localhost:3300',
      },
    },
    contentBase: path.join(__dirname, 'public'),
  },
  mode: 'development',
  entry: {
    index: path.resolve(__dirname, 'src', 'index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /workers\/.*\.js$/,
        loader: 'worker-loader',
        options: {
          name: '[name].[contenthash].[ext]',
        },
      },
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          babelrc: true,
        },
      },
      {
        test: /.wasm$/,
        type: 'javascript/auto',
        loader: 'file-loader',
        options: {
          publicPath: '',
          name: '[name].[hash].[ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src', 'index.html'),
      chunks: ['index'],
    }),
  ],
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
  },
};