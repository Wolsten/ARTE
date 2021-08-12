const path = require("path");
const libraryName = 'ARTE';
module.exports = {
  mode: 'development',
  entry: "./src/js/ARTE-ES6.js",
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
      }
    ]
  }
};