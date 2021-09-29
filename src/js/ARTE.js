// https://www.loginradius.com/blog/async/write-a-javascript-library-using-webpack-and-babel/// 

import Editor from './Editor.js'
import Modal from './Modal.js'
import * as Icons from './icons.js'
import * as Buffer from './plugins/buffer.js'
import * as Clipboard from './plugins/clipboard.js'
import * as Blocks from './plugins/blocks.js'
import * as Styles from './plugins/styles.js'
import * as Mentions from './plugins/mentions.js'
import * as Links from './plugins/links.js'
import * as Images from './plugins/images.js'
import * as Colours from './plugins/colours.js'
import * as Actions from './plugins/actions.js'
import * as Comments from './plugins/comments.js'
import * as Settings from './plugins/settings.js'


export {
    Editor,
    Modal,
    Buffer,
    Clipboard,
    Blocks,
    Styles,
    Mentions,
    Links,
    Images,
    Colours,
    Actions,
    Comments,
    Settings,
    Icons
}