// https://stackoverflow.com/questions/42719908/use-webpack-to-bundle-several-es6-classes-into-one-file-for-import-in-a-script-t

const Editor = require('./Editor.js').default
const Mentions = require('./plugins/mentions.js')
const Links = require('./plugins/links.js')
const Customs = require('./plugins/customPlugin.js')

export {Editor, Mentions, Links, Customs}