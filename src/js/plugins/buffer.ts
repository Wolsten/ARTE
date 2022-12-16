import * as Icons from '../icons.ts'
import ToolbarButton from '../ToolbarButton.js'

// -----------------------------------------------------------------------------
// @section Buffer class and instances - allows for multiple buffers if have 
// multiple editors on one page
// -----------------------------------------------------------------------------

class Buffer {
    constructor(size) {
        this.size = size
        this.index = -1
        this.buffer = []
        // this.buffering = true
    }
}

let buffers = []

// -----------------------------------------------------------------------------
// @section Click functions
// -----------------------------------------------------------------------------

/**
 * If available update the editor content with the last but one
 * entry in the buffer
 * @param {object} editor The editor instance
 */
const undo = function (editor) {
    if (editor.buffer) pause(editor.id)
    const buffer = buffers[editor.id]
    if (buffer.index > 0) {
        buffer.index--
        buffer.ignore = true
        console.warn(buffer.buffer[buffer.index])
        editor.editorNode.innerHTML = buffer.buffer[buffer.index]
    }
    setState(editor, UNDO)
    setState(editor, REDO)
    // if ( editor.options.debug ){
    //     console.log('buffer',buffer.buffer)
    //     console.log('buffer index', buffer.index)
    // }
    editor.updateEventHandlers()
}

/**
 * If available update the editor content with the next but one
 * entry in the buffer
 * @param {object} editor The editor instance
 */
const redo = function (editor) {
    if (editor.buffer) pause(editor.id)
    const buffer = buffers[editor.id]
    if (buffer.index + 1 < buffer.buffer.length) {
        buffer.index++
        buffer.ignore = true
        editor.editorNode.innerHTML = buffer.buffer[buffer.index]
    }
    setState(editor, UNDO)
    setState(editor, REDO)
    // if ( editor.options.debug ){
    //     console.log('buffer',buffer.buffer)
    //     console.log('buffer index', buffer.index)
    // }
    editor.updateEventHandlers()
}

// -----------------------------------------------------------------------------
// @section "Optional" functions" including update and ignore which are 
// none-standard methods with special handling in the editor. These should NOT
// be implemented in other plugins.
// -----------------------------------------------------------------------------


/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const setState = function (editor, button) {
    const buffer = buffers[editor.id]
    if (button.tag == 'UNDO') {
        button.element.disabled = buffer.buffer.length <= 1 || buffer.index <= 0
    } else {
        button.element.disabled = buffer.index >= buffer.buffer.length - 1
    }
}

/**
 * Initialise the buffering for this editor by creating a dedicated buffer instance
 * @param {object} editor 
 */
const init = function (editor) {
    if (editor.buffer && editor.options.bufferSize > 0) {
        buffers[editor.id] = new Buffer(editor.options.bufferSize)
    }
}

/**
 * Add a new item to the editor buffer and if required remove the first entry
 * when the maximum buffer size is reached
 * @param {object} editor The editor instance
 */
const update = function (editor) {
    if (buffers[editor.id] === undefined) {
        return
    }
    const buffer = buffers[editor.id]
    // Check that the new value is different
    if (buffer.buffer.length > 0 &&
        editor.editorNode.innerHTML == buffer.buffer[buffer.buffer.length - 1]) {
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
    buffer.buffer.push(editor.editorNode.innerHTML)
    buffer.index = buffer.buffer.length - 1
    // Update buttons
    setState(editor, UNDO)
    setState(editor, REDO)
    // Debug
    // if ( editor.options.debug ){
    //     console.log('buffer',buffer.buffer)
    //     console.log('index', buffer.index)
    // }
}

/**
 * Set buffering on
 * @param {number} id The editor instance id
 */
const restart = function (id) {
    if (buffers[id] !== undefined) {
        buffers[id].buffering = true
    }
}

/**
 * Pause buffering for one cycle
 * @param {number} id The editor instance id
 */
const pause = function (id) {
    if (buffers[id] !== undefined) {
        buffers[id].buffering = false
        // setTimeout( () => restart(id), 100)
    }
}

/**
* Get buffering state
* @param {number} id The editor instance id
* @returns {boolean} true for on and false for off
*/
const buffering = function (id) {
    if (buffers[id] !== undefined) {
        return buffers[id].buffering
    }
    return false
}





// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const undoOptions = { init, setState, update, buffering, restart, pause }
const redoOptions = { setState }
export const UNDO = new ToolbarButton('detached', 'UNDO', 'Undo', Icons.undo, undo, undoOptions)
export const REDO = new ToolbarButton('detached', 'REDO', 'Redo', Icons.redo, redo, redoOptions)
