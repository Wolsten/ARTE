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
    items: string[] = []
    editor: Editor
    buffering: boolean = false

    constructor(editor: Editor) {
        this.editor = editor
        if (editor?.options.bufferSize) {
            this.size = editor.options.bufferSize
        }
    }



    /**
     * Add a new item to the editor buffer and if required remove the first entry
     * when the maximum buffer size is reached
     */
    update() {
        if (!this.editor.editorNode) return
        // Check that the new value is different
        if (this.items.length > 0 &&
            this.editor.editorNode.innerHTML == this.items[this.items.length - 1]) {
            return
        }
        if (this.items.length > this.size) {
            // Remove first element
            this.items.shift()
        }
        // Check buffer index in case need to reset buffer when the user had
        // undone and then made new changes
        if ((this.index + 1) < this.items.length) {
            const items = this.items.length - (this.index + 1)
            for (let i = 0; i < items; i++) {
                this.items.pop()
            }
        }
        // Add the new one
        this.items.push(this.editor.editorNode.innerHTML)
        this.index = this.items.length - 1
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