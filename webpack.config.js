const path = require("path")
const libraryName = 'ARTE'

module.exports = (env) => {

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

    output: {
      path: path.resolve(__dirname, "public/js"),
      filename: `${libraryName}.js`,
      library: libraryName,
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },

    module: {
      rules: [ rule ]
    }
  }
}