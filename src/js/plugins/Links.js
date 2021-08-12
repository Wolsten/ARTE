/** 
 * Create active links, ie. links which can be edited rather than a normal html 
 */

import * as Modal from '../modalConfirm.js'
import ToolbarButton from '../ToolbarButton.js'
import * as Icons from '../icons.js'
import * as Helpers from '../helpers.js'

/**
 * @constant {string} TAG The HTMLElement tag as inserted in the dom for this custom node
 */
const TAG = 'A'
/**
 * @var {HTMLElement} node The actively edited node
 */
let node
/**
 * @var {boolean} dirty Flag whether input data changed
 */
let dirty
/**
 * @var {HTMLElement} panel The container for the edit dialogue
 */
let panel = null


// -----------------------------------------------------------------------------
// @section Private methods
// -----------------------------------------------------------------------------

/**
 * Edit an existing link
 * 
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 * @param {HTMLElement} element The custom node to be edited
 */
 function edit( editor, button, element ){
    // If we already have an active panel - ignore clicks on links
    if ( panel ){
        return
    }
    // Save the clicked link
    node = element
    // Show the dialogue, selected text (3rd param) is ignored
    show(editor, button, '', true)
}

/**
 * Show the link edit dialogue
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 * @param {string} selectedText 
 * @param {boolean} editFlag flag indicating whether to edit or create new
 */
function show( editor, button, selectedText, editFlag ){
    if ( editFlag == false ){
        node = document.createElement(TAG)
        node.id = Helpers.generateUid()
        node.setAttribute('contenteditable','false')
        node.href = ''
        node.dataset.label = selectedText
        node.dataset.display = 0
    }
    panel = document.createElement('DIV')
    panel.id = 'link-edit'
    panel.classList.add('edit-panel')
    panel.innerHTML = form( editFlag )
    // Initialise confirmation module and dirty data detection
    dirty = false
    const inputs = panel.querySelectorAll('form input')
    inputs.forEach(input => input.addEventListener('change', () => dirty=true))
    // Handle button events
    panel.querySelector('button.cancel').addEventListener('click', () => {
        if ( dirty ){
            const confirmBtn = Modal.show('Cancel changes', 'Do you really want to lose these changes?')
            confirmBtn.addEventListener( 'click', () => {
                Modal.hide()
                hide()
            })
        } else {
            hide()
        }
    })
    if ( editFlag ){
        panel.querySelector('button.delete').addEventListener('click', () => {
            const confirmBtn = Modal.show('Delete link', 'Do you really want to delete this link?')
            confirmBtn.addEventListener( 'click', () => {
                Modal.hide()
                deleteItem(editor, button) 
            })
        })
    }
    panel.querySelector('form').addEventListener('submit', event => {
        event.preventDefault()
        save(editor, button, editFlag )
    })
    // Add to dom, position and focus the input
    document.querySelector('body').appendChild(panel)
    const href = panel.querySelector('form #href')
    href.focus()
    href.setSelectionRange(href.value.length, href.value.length)
    // Add show class to display with transition
    setTimeout( ()=>panel.classList.add('show'),10 )
}

/**
 * Save the changes set in the dialogue
 * @param {object} editor A unique editor instance
 * @param {object} button The button to clicked
 * @param {boolean} editFlag Flag whether to insert new or update existing link
 */
function save( editor, button, editFlag ){
    // console.log('Save changes')
    node.href = panel.querySelector('form #href').value.trim()
    node.dataset.label = panel.querySelector('form #label').value.trim()
    node.dataset.display = parseInt(panel.querySelector('form #display').value)
    if ( editFlag==false ){
        insert(editor, button)
    }
    // Format link and add event handler
    format(editor, button, node)
    hide()
    // Update state
    editor.range = Helpers.setCursor( node, 0)
    setState(editor, button)
} 

/**
 * Insert a new link in the editor at the end of the current 
 * range's startContainer
 * @param {object} editor A unique editor instance
 */
 function insert(editor){
    const parent = editor.range.startContainer.parentNode
    // Get any pretext pr post text in the current container that is not selected
    let preText = editor.range.startContainer.textContent.substring(0,editor.range.startOffset)
    let postText
    if ( editor.range.collapsed ){
        postText = editor.range.startContainer.textContent.substring(editor.range.startOffset)
        // Insert leading and trailing spaces if needed
        if ( preText.charAt(preText.length+1) != ' ' ){
            preText = preText + ' '
        }
        if ( postText.charAt(0) != ' ' ){
            postText = ' ' + postText
        }
    } else {
        postText = editor.range.startContainer.textContent.substring(editor.range.endOffset)
    }
    // Insert pretext before the current container
    if ( preText ) {
        parent.insertBefore(document.createTextNode(preText), editor.range.startContainer)
    }
    // Insert the node before the current container
    node = parent.insertBefore(node, editor.range.startContainer)
    // Insert post text before the current container
    if ( postText ) {
        parent.insertBefore(document.createTextNode(postText), editor.range.startContainer)
    }
    // Remove the pre-existing container
    editor.range.startContainer.remove()
}

/**
 * Delete the link in the dom
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
 function deleteItem(editor, button){
    //node = editorNode.querySelector(`${TAG}#${data.id}`)
    node.remove()
    hide()
    // Update state
    editor.range = false
    setState(editor, button)
}

/**
 * Hide the dialogue with transition
 */
function hide(){
    panel.classList.remove('show')
    setTimeout( ()=>{
        panel.remove()
        panel = null
    }, 500)
}

/**
 * Generate the label to be used for the link
 * @param {HTMLElement} link 
 * @returns {string} The string to display
 */
function label(link){
    // Test the display option saved with the link
    switch (parseInt(link.dataset.display)){
        // Display as text label?
        case 0:
            // Label is an optional parameter
            if ( link.dataset.label ){
                return link.dataset.label
            }
            break
        // Display as the href
        case 1:
            return link.href
        // Assuming they are different display as "label (href)""
        case 2:
            if ( link.dataset.label && link.dataset.label != link.href ){
                return `${link.dataset.label} (${link.href})`
            }
    }
    // Default to the href
    return link.href
}

/**
 * The format of a source link element is:
 * <a href="href" data-label="label" data-display="0|1|2"> </a>
 * 
 * The formatted link looks like this:
 * <a href="href" id="unique-editor-id" data-label="label" data-display="0|1|2" contenteditable="false">
 *      [label|link|label (link)]
 * </a>
 * 
 * @param {object} editor A unique editor instance
 * @param {object} button The button to use
 * @param {HTMLElement} element
 */
function format( editor, button, element ){
    // Generate new id if required
    if ( element.id == false ){
        element.id = Helpers.generateUid()
    }
    element.setAttribute('contenteditable',false)
    element.title = 'Click to edit'
    element.innerText = label(element)
    element.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        edit(editor, button, element) 
    })
}

/**
 * Generate html for a dialogue to create/edit a link
 * @param {boolean} edit flag
 * @returns {string} HTML string
 */
function form(edit){
    let title = 'Create link'
    let delBtn = ''
    let openBtn = ''
    let href = 'http://'
    let label = node.dataset.label
    let display = node.dataset.display ? node.dataset.display : 0
    if ( edit) {
        title = 'Edit link'
        href = node.href
        delBtn = `<button type="button" class="delete">Delete</button>`
        openBtn = `<a href="${href}" class="panel-link" target="_blank" title="Open link in new tab or window">${Icons.openLink}</a>`
    }
    return `
        <div class="edit-panel-container">
            <div class="edit-panel-header">
                <h3 class="edit-panel-title">${title}</h3>
            </div>
            <div class="edit-panel-body">
                <form>
                    <div class="form-input">
                        <label for="href">URL</label>
                        <input id="href" type="url" class="form-control ${openBtn ? 'with-button' : ''}" placeholder="URL" required value="${href}">
                        ${openBtn}
                    </div>
                    <div class="form-input">
                        <label for="label">Label (optional)</label>
                        <input id="label" type="text" class="form-control" placeholder="Label" value="${label}">
                    </div>
                    <div class="form-input">
                        <label for="label">Display option</label>
                        <select class="form-control" id="display">
                            <option value="0" ${display==0 ? 'selected' : ''}>Label only</option>
                            <option value="1" ${display==1 ? 'selected' : ''}>Link only</option>
                            <option value="2" ${display==2 ? 'selected' : ''}>Label and link</option>
                        </select>
                    </div>
                    <div class="buttons">
                        <button type="button" class="cancel">Cancel</button>
                        ${delBtn}
                        <button type="submit" class="save">Save</button>
                    </div>
                </form>
            </div>
        </div>`
}


/**
 * Optional method that, on first load of editor, converts the minimal custom 
 * HTML into the full editable version
 * @param {object} editor A unique editor instance
 * @param {object} button The button to use
 */
const init = function( editor, button ){
    // console.log('Initialising links')
    const links = editor.editorNode.querySelectorAll( TAG )
    links.forEach( link => format( editor, button, link ))
}

/**
 * Mandatory button click function which displays the colour dialogue
 * for the supplied button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const click = function( editor, button ){
    console.log('click link')
    if ( editor.range === false){
        console.log('No range selected')
        return
    }
    // Get default label if range not collapsed
    let selectedText = ''
    if ( editor.range.collapsed == false && 
         editor.range.startContainer == editor.range.endContainer ){
        selectedText = editor.range.endContainer.textContent.substring(editor.range.startOffset, editor.range.endOffset)  
    }
    show( editor, button, selectedText, false )
}

/**
 * Optional method to add event handlers to all custom links
 * @param {object} editor 
 */
const addEventHandlers = function(editor){
    const nodes = editor.editorNode.querySelectorAll(TAG)
    nodes.forEach( node => node.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        edit(editor, BUTTON, node) 
    }))
}

/**
 * Optional method to reformat/clean the custom element as it should be saved in a file or database
 * @param {HTMLElement} node
 * @returns HTMLElement as cleaned
 */
const clean = function(node){
    console.log('clean link',node)
    node.removeAttribute('id')
    node.removeAttribute('contenteditable')
    // Clear inner text because label saved in dataset
    node.innerText = ' '
    return node
}

/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
 const setState = function( editor, button ){
    if ( editor.range === false  || 
        (editor.range.collapsed==false && editor.range.startContainer != editor.range.endContainer) ){
        button.element.disabled = true
        button.element.classList.remove('active')
    } else {
        button.element.disabled = false
        const link = editor.range.blockParent.querySelector(TAG)
        if ( link != null ){
            button.element.classList.add('active')
        } else {
            button.element.classList.remove('active')
        }
    }
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const options = {init, setState, addEventHandlers, clean}
export const BUTTON = new ToolbarButton( 'custom', TAG, 'Link', Icons.link, click, options ) 