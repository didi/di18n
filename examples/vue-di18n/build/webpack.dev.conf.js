var path = require('path')
var webpack = require('webpack')
var merge = require('webpack-merge')
var webpackBaseConfig = require('./webpack.base.conf.js')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

var webpackConfig = merge(webpackBaseConfig, {
  mode: 'development',
  devtool: 'source-map',
  output: {
    filename: 'static/js/[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      inject: true
    }),
    new ExtractTextPlugin({
      filename: 'static/css/[name].css',
      allChunks:true
    }),
  ],
  devServer: {
    port: 8080,
    historyApiFallback: true,
    publicPath: '/',
    contentBase: './',
    hot: true
  }
})

module.exports = webpackConfig
