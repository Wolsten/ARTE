const path = require("path");
const libraryName = 'ARTE';
module.exports = {
  mode: 'production',
  entry: "./src/js/ARTE-ES5.js", // For ES6 version replace with ARTE.js
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
        // Transpile using Babel
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