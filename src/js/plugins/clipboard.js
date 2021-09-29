/** 
 * Handle cut, copy and paste
 */

import ToolbarButton from '../ToolbarButton.js'
import * as Icons from '../icons.js'
import * as Helpers from '../helpers.js'
import Modal from '../Modal.js'

let supported
let editor

/**
 * Prevent clipboard events which include custom nodes
 * @param {Selection} selection 
 * @returns {boolean} true if found customs in selection, else false
 */
function prevent(selection){
    const contains = Helpers.selectionContainsCustoms(editor.editorNode, selection )
    if ( contains ){
        const feedback = new Modal({
            type:'overlay', 
            severity:'info',
            title: 'Information',
            html: `<p>Cut, copy and paste (of or over) selections with active elements, such as comments or links, is not supported.</p>
                   <p>Please modify your selection and try again.</p>`,
            escape:true,
            buttons: {cancel:{label:'Close'}}
        })
        feedback.show()
        return true
    }
    return false
}

/**
 * Handle cut and copy events
 * @param {Event} event 
 */
function cutCopyHandler(event) {
    const selection = document.getSelection()
    if ( prevent(selection) ){
        event.preventDefault()
    }
    if ( event.type == 'cut' ){
        setTimeout( ()=>editor.buffer(), 100 )
    }
}

/**
 * Handle cut button clicks
 */
function cut(){
    const selection = document.getSelection()
    if ( prevent(selection) == false ){
        console.log('selection',selection.toString())
        navigator.clipboard.writeText(selection.toString())
        selection.deleteFromDocument()
        setTimeout( ()=>editor.buffer(), 100 )
    }
}

/**
 * Handle cut button clicks
 */
function copy(){
    const selection = document.getSelection()
    if ( prevent(selection) == false ){
        console.log('selection',selection.toString())
        navigator.clipboard.writeText(selection.toString())
    }
}

/**
 * Handle paste button clicks
 */
async function paste(){
    const selection = document.getSelection()
    if ( prevent(selection) == false ){
        const text = await navigator.clipboard.readText()
        console.log('pasted text is ',text)
        let node = document.createTextNode(text)
        node = Helpers.replaceSelectionWithNode(editor, node)
        setTimeout( ()=>editor.buffer(), 100 )
    }
}

/**
 * Handle paste events
 * @param {Event} event 
 */
function pasteHandler(event) {
    const selection = document.getSelection()
    if ( prevent(selection) == false ){
        const paste = (event.clipboardData || window.clipboardData).getData('text/html');
        // Detect pasting from Microsoft Office and paste as plain text
        if ( supported && paste.includes('urn:schemas-microsoft-com:office')){
            console.log('Found word data')
            // Get plain text
            const text = (event.clipboardData || window.clipboardData).getData('text/plain');
            console.log('text\n',text)
            event.preventDefault()
            // Special handling of paste
            let node = document.createTextNode(text)
            node = Helpers.replaceSelectionWithNode(editor, node)
        }
        setTimeout( ()=>editor.buffer(), 100 )
    }
}


/**
 * Optional method that, on first load of editor, converts the minimal custom 
 * HTML into the full editable version
 * @param {object} edt A unique editor instance
 * @param {object} button The button to use (ignored)
 */
 const init = function( edt, button){
    editor = edt
    if (navigator.clipboard) {
        supported = true
        // Event listeners
        editor.editorNode.addEventListener('cut', cutCopyHandler)
        editor.editorNode.addEventListener('copy', cutCopyHandler)
        editor.editorNode.addEventListener('paste', pasteHandler)
    }
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
            cut()
            break
        case 'COPY':
            copy()
            break
        case 'PASTE':
            paste()
            break
    }
}


/**
 * Set the disabled and active states of the paste button
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to act on
 */
const setState = async function(edt, btn){
    console.log('set state for button',btn.tag)
    switch ( btn.tag ){
        case 'PASTE':
            if ( document.activeElement == edt.editorNode ){
                const text = await navigator.clipboard.readText()
                btn.element.disabled = text == ''
            } else {
                btn.element.disabled = true
            }
            break
        case 'CUT':
        case 'COPY':
            if ( edt.range == false || edt.range.collapsed ){
                btn.element.disabled = true
            } else {
                btn.element.disabled = false
            }
    }
    // All buttons disabled (if not already) if selection contains any custom elements
    if ( btn.element.disabled == false ){
        const selection = document.getSelection()
        btn.element.disabled = Helpers.selectionContainsCustoms(editor.editorNode, selection )
    }
}



// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const CUT = new ToolbarButton( 'detached', 'CUT', 'Cut (text only - use Ctr-V or Cmd-V to include formatting)', Icons.cut, click, {init,setState} ) 
export const COPY = new ToolbarButton( 'detached', 'COPY', 'Copy (text only - use Ctr-V or Cmd-V to include formatting)', Icons.copy, click, {setState} ) 
export const PASTE = new ToolbarButton( 'detached', 'PASTE', 'Paste (text only - use Ctr-V or Cmd-V to include formatting)', Icons.paste, click, {setState} ) 
 