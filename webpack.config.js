const path = require("path")
const { env } = require("process")
const TerserPlugin = require("terser-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin");

const libraryName = 'ARTE'
let fileName = libraryName + '-bundle'


module.exports = (env) => {

  if ( env.target  ){
    fileName += '-' + env.target
  }

  const rule = {
    test: /\.js$/,
    exclude: /(node_modules)/
  }
  
  // Transpile using Babel?
  if ( env.target == 'ES5' ){
    rule.use =  {
      loader: "babel-loader",
      options: {
        presets: ['@babel/preset-env']
      }
    }
  }

  return {

    mode: env.mode,

    entry: "./src/js/ARTE.js",

    // Output is used by CopyPlugin as the root destination folder 
    output: {
      path: path.resolve(__dirname, "public"),
      filename: `js/${fileName}.js`,
      library: libraryName,
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },

    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          test: /\.js(\?.*)?$/i,
          terserOptions: {
            // Filter console outputs
            // https://github.com/terser/terser#compress-options
            compress: {
              drop_console:true
            }
          }
        }),
      ],
    },

    plugins: [
      // Copy static assets
      new CopyPlugin({
        patterns: [
          {
            from: "src/img/*",
            to:"img/[name][ext]"
          },
          {
            from: "src/css/*",
            to:"css/[name][ext]"
          },
          {
            from: "favicon*.*",
            to:"[name][ext]"
          },
        ],
      }),
    ],

    module: {
      rules: [ 
        rule
      ]
    }
  }
}