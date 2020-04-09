const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const __DEV__ = process.env.NODE_ENV !== 'development';

const cssLoaders = [
  {
    loader: MiniCssExtractPlugin.loader,
    options: {
      hmr: __DEV__,
      reloadAll: true
    },
  },

  'css-loader',

  {
    loader: 'postcss-loader',
    options: {
      plugins: [autoprefixer]
    }
  }
];

module.exports = {
  entry: {
    app: './src/index.js'
  },

  output: {
    filename: 'js/[name]-[contenthash].js',
    path: path.resolve('dist'),
    publicPath: '/'
  },

  plugins: [
    new CleanWebpackPlugin(),

    new webpack.HashedModuleIdsPlugin(),

    new MiniCssExtractPlugin({
      filename: 'css/[name]-[contenthash].css'
    }),

    new HtmlWebpackPlugin({
      template: './src/index.html',
      favicon: './src/favicon.ico'
    }),

  ],

  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              '@babel/preset-env'
            ],

            plugins: [
              ['import', { libraryName: 'antd', style: true }],
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-runtime'
            ]
          }
        }
      },

      {
        test: /\.css$/,
        use: cssLoaders
      },

      {
        test: /\.scss$/,
        use: cssLoaders.concat('sass-loader')
      },

      {
        test: /\.less$/,
        use: cssLoaders.concat({
          loader: 'less-loader',
          options: {
            javascriptEnabled: true
          }
        })
      },

      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'img/[name]-[contenthash].[ext]'
            }
          }
        ]
      },

      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader']
      }
    ]
  }
};
