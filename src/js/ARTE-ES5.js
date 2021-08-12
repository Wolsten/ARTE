// https://stackoverflow.com/questions/42719908/use-webpack-to-bundle-several-es6-classes-into-one-file-for-import-in-a-script-t

const Editor = require('./Editor.js').default
const Blocks = require('./plugins/blocks.js')
const Styles = require('./plugins/styles.js')
const Mentions = require('./plugins/mentions.js')
const Buffer = require('./plugins/buffer.js')
const Colours = require('./plugins/colours.js')
const Links = require('./plugins/links.js')
const Custom = require('./plugins/custom.js')

export {Editor, Blocks, Styles, Mentions, Links, Buffer, Colours, Custom}