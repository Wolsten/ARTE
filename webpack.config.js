const path = require("path");
const libraryName = 'ARTE';

// Modify mode 'development' to 'production' to create a compressed version
module.exports = {
  // mode: 'development',
  mode: 'production',
  entry: "./src/js/ARTE-BUILD.js",
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
        // Uncomment to transpile using Babel
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