/** 
 * Handle cut, copy and paste
 */

import ToolbarButton from '../ToolbarButton.js'
import * as Icons from '../icons.js'
import * as Helpers from '../helpers.js'
//  import Modal from '../Modal.js'

let supported


// cut or copy event handler
function cutCopyHandler(event) {

    const selection = document.getSelection()
    console.log({selection})

    // Save to clipboad
    event.clipboardData.setData(
        'text/plain',
        selection.toString()
    )
  
    if ( event.type=='cut' ) cut(selection)
  
    event.preventDefault()
}

function cut(selection){
    selection.deleteFromDocument()
}

function pasteHandler(event) {

    console.log({event})

    console.log('Pasting', event.clipboardData.getData('text'))

    // add 'pasted:' to pasted text
    // const paste = 'pasted:\n' + event.clipboardData.getData('text')
  
    // event.target.value = paste
  
    // stop default paste
    // event.preventDefault()
}


/**
 * Optional method that, on first load of editor, converts the minimal custom 
 * HTML into the full editable version
 * @param {object} editor A unique editor instance
 * @param {object} button The button to use
 */
 const init = function( editor, button){
    if (navigator.clipboard) {
        supported = true
        // Event listeners
        editor.editorNode.addEventListener('cut', cutCopyHandler)
        editor.editorNode.addEventListener('copy', cutCopyHandler)
        editor.editorNode.addEventListener('paste', pasteHandler)
    }
    console.log({supported})
}


/**
 * Mandatory button click function
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const click = function( editor, button ){
    if ( supported === false ){
        return
    }
    switch( button.tag ){
        case 'CUT':
            console.log('cut')
            const selection = document.getSelection()
            console.log({selection})
            cut(selection)
            break
        case 'COPY':
            console.log('copy')
            break
        case 'PASTE':
            console.log('paste')
            break
    }
}


/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const setState = function(editor, button){
    return
}



// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const CUT = new ToolbarButton( 'detached', 'CUT', 'Cut', Icons.cut, click, {init, setState} ) 
export const COPY = new ToolbarButton( 'detached', 'COPY', 'Copy', Icons.copy, click, {setState} ) 
export const PASTE = new ToolbarButton( 'detached', 'PASTE', 'Paste', Icons.paste, click, {setState} ) 
 