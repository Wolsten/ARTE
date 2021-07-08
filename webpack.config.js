const path = require("path");
const libraryName = 'AJE';

// Modify mode to 'production' to create a compressed version
module.exports = {
  mode: 'development',
  entry: "./src/js/index.js",
  output: {
    path: path.resolve(__dirname, "public/js"),
    filename: `${libraryName}.js`,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};