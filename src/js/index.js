// https://stackoverflow.com/questions/42719908/use-webpack-to-bundle-several-es6-classes-into-one-file-for-import-in-a-script-t

const Editor = require('./Editor.js').default
const Mentions = require('./plugins/Mentions.js').default
const Icons = require('./icons.js')

export {Editor, Mentions, Icons}