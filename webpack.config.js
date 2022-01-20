const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');



module.exports = (env, argv) => {
  //const indexName = argv.mode == "production" ? "index.html" : "index_dev.html";

  let config = {
    devServer: {
      host: '0.0.0.0',
      port: 3000,
      https: true,
      proxy: {
        '/models': {
          target: 'http://localhost:4400',
        },
      },
      contentBase: path.join(__dirname, 'public'),
    },
    mode: 'development',
    entry: {
      index: path.resolve(__dirname, 'src', 'index.js'),
    },
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'kaldi.main.js',
      library: "KaldiWeb",
      // publicPath = Place of kaldi .js and .wasm files when used in a website.
      // !!!NOTE: The .wasm files must be nested inside another folder called kaldi too.
      // kaldi/kaldi/foo.wasm
      // It's very stupid but that's how it works.
      publicPath: 'kaldi/',
    },
    target: 'web',
    module: {
      rules: [
        {
          test: /workers\/.*\.js$/,
          loader: 'worker-loader',
          options: {
            //publicPath: '/kaldi/',
            name: '[name].[ext]',
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
            //publicPath: '/kaldi/',
            name: '[name].[ext]',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: path.resolve(__dirname, 'src', "index.html"),
        chunks: ['index'],
      }),
    ],
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
      extensions: ['.js', '.jsx'],
    },
  };

  return config;
}