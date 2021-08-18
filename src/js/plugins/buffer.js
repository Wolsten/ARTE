import * as Icons from '../icons.js'
import ToolbarButton from '../ToolbarButton.js'

/**
 * If available update the editor content with the last but one
 * entry in the buffer
 * @param {object} editor The editor instance
 */
const undo = function(editor){
    if ( editor.bufferIndex > 0 ){
        editor.bufferIndex --
        editor.bufferIgnore = true
        editor.editorNode.innerHTML = editor.buffer[ editor.bufferIndex ]
    }
    setState( editor, UNDO )
    setState( editor, REDO )
    if ( editor.options.debug ){
        console.log('buffer',editor.buffer)
        console.log('buffer index', editor.bufferIndex)
    }
    editor.updateEventHandlers()
}

/**
 * If available update the editor content with the next but one
 * entry in the buffer
 * @param {object} editor The editor instance
 */
const redo = function(editor){
    if ( editor.bufferIndex + 1 < editor.buffer.length ){
        editor.bufferIndex ++
        editor.bufferIgnore = true
        editor.editorNode.innerHTML = editor.buffer[ editor.bufferIndex ]
    }
    setState( editor, UNDO )
    setState( editor, REDO )
    if ( editor.options.debug ){
        console.log('buffer',editor.buffer)
        console.log('buffer index', editor.bufferIndex)
    }
    editor.updateEventHandlers()
}

/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const setState = function( editor, button ){
    if ( button.tag == 'UNDO' ){
        button.element.disabled = editor.buffer.length<=1 || editor.bufferIndex <= 0
    } else {
        button.element.disabled = editor.bufferIndex >= editor.buffer.length - 1
    }
}

/**
 * Add a new item to the editor buffer and if required remove the first entry
 * when the maximum buffer size is reached
 * @param {object} editor The editor instance
 */
export const update = function(editor){
    if ( editor.options.bufferSize == 0 ){
        return
    }
    if ( editor.buffer.length > editor.options.bufferSize ){
        // Remove first element
        editor.buffer.shift()
    }
    // Check buffer index in case need to reset buffer when the user had
    // undone and then made new changes
    if ( (editor.bufferIndex + 1) < editor.buffer.length ){
        const items = editor.buffer.length - (editor.bufferIndex + 1)
        for( let i=0; i<items; i++){
            editor.buffer.pop()
        }
    }
    // Add the new one
    editor.buffer.push(editor.editorNode.innerHTML)
    editor.bufferIndex = editor.buffer.length - 1
    // Update buttons
    setState( editor, UNDO )
    setState( editor, REDO )
    // console.log('buffer',editor.buffer)
    // console.log('buffer index', editor.bufferIndex)
}

/**
 * Return the current value of the buffer ignore flag but at the
 * same time reset the flag so that buffering until set again
 * This facility ensures that not all updates to the editor 
 * content are acted on immediately
 * @param {object} editor The editor instance
 * @returns 
 */
export const ignore = function(editor){
    let current = editor.bufferIgnore
    editor.bufferIgnore = false
    return current
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const options = {setState}
export const UNDO = new ToolbarButton('buffer','UNDO','Undo', Icons.undo, undo, options)
export const REDO = new ToolbarButton('buffer','REDO','Redo', Icons.redo, redo, options)
