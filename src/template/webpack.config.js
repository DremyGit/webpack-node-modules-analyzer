/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

const debugData =
  process.env.NODE_ENV !== 'production' ? require('./chart.json') : undefined;

module.exports = {
  entry: path.resolve(__dirname, './index.ts'),
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'none',
  output: {
    path: path.resolve(__dirname, '../../lib/template'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, './tsconfig.json')
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  externals: {
    '@antv/data-set': 'DataSet',
    '@antv/g2': 'G2'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, './index.html'),
      templateParameters: {
        debugData
      }
    }),
    new ScriptExtHtmlWebpackPlugin({
      inline: process.env.NODE_ENV === 'production' ? 'bundle' : false
    })
  ]
};
