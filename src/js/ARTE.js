// https://www.loginradius.com/blog/async/write-a-javascript-library-using-webpack-and-babel/// 

import Editor from './Editor.js'
import * as Buffer from './plugins/buffer.js'
import * as Blocks from './plugins/blocks.js'
import * as Styles from './plugins/styles.js'
import * as Mentions from './plugins/mentions.js'
import * as Links from './plugins/links.js'
import * as Colours from './plugins/colours.js'
import * as Custom from './plugins/custom.js'

export {
    Editor,
    Buffer,
    Blocks,
    Styles,
    Mentions,
    Links,
    Colours,
    Custom
}