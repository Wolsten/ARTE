import * as Icons from '../icons.js'
import ToolbarButton from '../ToolbarButton.js'

const undo = function(editor){
    if ( editor.bufferIndex > 0 ){
        editor.bufferIndex --
        editor.bufferIgnore = true
        editor.editorNode.innerHTML = editor.buffer[ editor.bufferIndex ]
    }
    setState( editor, UNDO )
    setState( editor, REDO )
    console.log('buffer',editor.buffer)
    console.log('buffer index', editor.bufferIndex)
    editor.updateEventHandlers()
}

const redo = function(editor){
    if ( editor.bufferIndex + 1 < editor.buffer.length ){
        editor.bufferIndex ++
        editor.bufferIgnore = true
        editor.editorNode.innerHTML = editor.buffer[ editor.bufferIndex ]
    }
    setState( editor, UNDO )
    setState( editor, REDO )
    console.log('buffer',editor.buffer)
    console.log('buffer index', editor.bufferIndex)
    editor.updateEventHandlers()
}

const setState = function( editor, button ){
    if ( button.tag == 'UNDO' ){
        button.element.disabled = editor.buffer.length<=1 || editor.bufferIndex <= 0
    } else {
        button.element.disabled = editor.bufferIndex >= editor.buffer.length - 1
    }
}

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
    console.log('buffer',editor.buffer)
    console.log('buffer index', editor.bufferIndex)
}

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
