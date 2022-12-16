import { supported } from 'browser-fs-access'
import Editor from '../Editor'
import * as Icons from '../icons.ts'
import ToolbarButton from '../ToolbarButton.js'

// -----------------------------------------------------------------------------
// @section Buffer class and instances - allows for multiple buffers if have 
// multiple editors on one page
// -----------------------------------------------------------------------------

// class Buffer {
//     constructor(size) {
//         this.size = size
//         this.index = -1
//         this.buffer = []
//         // this.buffering = true
//     }
// }
// let buffers: Buffer[] = []

// let buffers: Map<string, Buffer> = new Map()

// -----------------------------------------------------------------------------
// @section Click functions
// -----------------------------------------------------------------------------





// -----------------------------------------------------------------------------
// @section "Optional" functions" including update and ignore which are 
// none-standard methods with special handling in the editor. These should NOT
// be implemented in other plugins.
// -----------------------------------------------------------------------------




// /**
//  * Initialise the buffering for this editor by creating a dedicated buffer instance
//  * @param {object} editor 
//  */
// const init = function (editor) {
//     if (editor.buffer && editor.options.bufferSize > 0) {
//         buffers[editor.id] = new Buffer(editor.options.bufferSize)
//     }
// }



/**
 * Set buffering on
 * @param {number} id The editor instance id
 */
const restart = function (id) {
    if (buffers[id] !== undefined) {
        buffers[id].buffering = true
    }
}









// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------


export default class Buffer {

    size: number = 0
    index: number = -1
    ignore: boolean = false
    items: string[]
    editor: Editor
    buffering: boolean = false

    constructor(kind: string, editor: Editor) {
        this.editor = editor
        kind = kind.toUpperCase()
        if (kind === 'UNDO') {
            this.buffer = new ('detached', 'UNDO', 'Undo', Icons.undo, undo, { update, buffering, restart, pause })
            this.size = editor.options.bufferSize
        } else {
            super('detached', 'REDO', 'Redo', Icons.redo, redo)
        }
        this.editor = editor
    }



    /**
     * Add a new item to the editor buffer and if required remove the first entry
     * when the maximum buffer size is reached
     */
    update() {
        const buffer = buffers.get(this.editor.id)
        if (buffer === undefined) {
            return
        }
        // Check that the new value is different
        if (buffer.buffer.length > 0 &&
            this.editor.editorNode.innerHTML == buffer.buffer[buffer.buffer.length - 1]) {
            return
        }
        if (buffer.buffer.length > buffer.size) {
            // Remove first element
            buffer.buffer.shift()
        }
        // Check buffer index in case need to reset buffer when the user had
        // undone and then made new changes
        if ((buffer.index + 1) < buffer.buffer.length) {
            const items = buffer.buffer.length - (buffer.index + 1)
            for (let i = 0; i < items; i++) {
                buffer.buffer.pop()
            }
        }
        // Add the new one
        buffer.buffer.push(this.editor.editorNode.innerHTML)
        buffer.index = buffer.buffer.length - 1
        // Update buttons
        this.setState()
        // Debug
        // if ( editor.options.debug ){
        //     console.log('buffer',buffer.buffer)
        //     console.log('index', buffer.index)
        // }
    }


    /**
     * Pause buffering for one cycle
     */
    pause(): void {
        this.buffering = false
    }


}