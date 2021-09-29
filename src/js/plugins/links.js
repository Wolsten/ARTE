/** 
 * Create active links, ie. links which can be edited rather than a normal html. 
 * 
 * File format:
 * <arte-link id="id" data-href="url" data-label="label" data-display="0"></arte-link>
 * 
 * Editor format:
 * <arte-link id="id" data-label="label" data-display="0" contenteditable="false" title="Click to edit">
 *      <a href="url">[url|label (url)|label]</a>
 * </arte-link>
 * 
 * Sidebar format:
 * <article>
 *      <a href="#id">label (url)</a>
 * </article>
 */

import ToolbarButton from '../ToolbarButton.js'
import * as Icons from '../icons.js'
import * as Helpers from '../helpers.js'
import Modal from '../Modal.js'

/**
 * @constant {string} TAG The HTMLElement tag as inserted in the dom for this custom node
 */
const TAG = 'ARTE-LINK'
/**
 * @var {object} editor The current editor instance
 */
let editor
 /**
  * @var {object} button The current button
  */
let button
/**
 * @var {HTMLElement} node The actively edited node
 */
let node
/**
 * @var {boolean} dirty Flag whether input data changed
 */
let dirty
/**
 * @var {Modal} panel The container for the modal edit dialogue
 */
let drawer = null
/**
 * @var {Modal} confirm The container for the modal confirm dialogue
 */
 let confirm = null


// -----------------------------------------------------------------------------
// @section Private methods
// -----------------------------------------------------------------------------

function handleConfirmCancel(){
    confirm.hide()
    drawer.hide()
}

function handleCancel(){
    if ( dirty ){
        confirm = Helpers.modalRequestCancel(handleConfirmCancel)
    } else {
        drawer.hide()
    }
}

/**
 * Delete the link in the dom
 */
 function deleteItem(){
    node.remove()
    // Update state
    editor.range = false
    setState(editor, button)
    editor.buffer()
}

function handleConfirmDelete(){
    confirm.hide()
    drawer.hide()
    deleteItem() 
}

function handleDelete(){
    confirm = Helpers.modalRequestDelete( 'link', handleConfirmDelete )
}


/**
 * Edit an existing link
 *
 * @param {HTMLElement} element The custom node to be edited
 */
 function edit( element ){
    // If we already have an active panel - ignore edit clicks
    if ( drawer && drawer.active() ){
        return
    }
    // Save the clicked link
    node = element
    // Show the dialogue
    show('', true)
}

/**
 * Show the link edit dialogue
 * @param {string} selectedText 
 * @param {boolean} editFlag flag indicating whether to edit or create new
 */
function show( selectedText, editFlag ){
    let title = 'Create link'
    let buttons = {
        cancel: { label:'Cancel', callback:handleCancel },
        confirm: { label:'Save', callback:save }
    }
    if ( editFlag ){
        title = 'Edit link'
        buttons.delete = { label:'Delete', callback:handleDelete }
    } else {
        node = document.createElement(TAG)
        node.id = Helpers.generateUid()
        node.setAttribute('contenteditable','false')
        node.dataset.href = ''
        node.dataset.label = selectedText
        node.dataset.display = 0
    }
    // Create and display the modal panel
    drawer = new Modal({
        type:'drawer',
        title,
        html: form(editFlag), 
        buttons
    })
    drawer.show()
    // Initialise confirmation module and dirty data detection
    dirty = false
    const inputs = drawer.panel.querySelectorAll('form input')
    inputs.forEach(input => input.addEventListener('change', () => dirty=true))
    // Focus the href
    const href = drawer.panel.querySelector('form #href')
    href.focus()
    href.setSelectionRange(href.value.length, href.value.length)
}

/**
 * Save the changes set in the dialogue
 */
function save(){
    // console.log('Save changes')
    // Replace node in editor
    if ( node.parentNode == null ){
        node = Helpers.replaceSelectionWithNode(editor, node)
    }
    // Save new properties
    node.dataset.href = drawer.panel.querySelector('form #href').value.trim()
    node.dataset.label = drawer.panel.querySelector('form #label').value.trim()
    node.dataset.display = parseInt(drawer.panel.querySelector('form #display').value)
    // Close the modal
    drawer.hide()
    // Format link and add event handler
    format(node)
    // Update state
    editor.range = Helpers.setCursor( node, 0)
    setState(editor, button)
    editor.buffer()
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
            if ( link.dataset.label != '' ){
                return link.dataset.label
            }
            break
        // Display as the href
        case 1:
            return link.dataset.href
        // Assuming they are different display as "label (href)""
        case 2:
            if ( link.dataset.label != '' && link.dataset.label != link.dataset.href ){
                return `${link.dataset.label} (${link.dataset.href})`
            }
    }
    // Default to the href
    return link.dataset.href
}

/**
 * Format a link node
 * 
 * @param {HTMLElement} element
 */
function format( element ){
    // Generate new id if required
    if ( element.id == false ){
        element.id = Helpers.generateUid()
    }
    element.setAttribute('contenteditable',false)
    element.title = 'Click to edit'
    // Initialise and add anchor tag
    element.innerHTML = ''
    const link = document.createElement('a')
    link.href = element.dataset.href
    link.innerText = label(element)
    element.appendChild(link)
    // Add event listener
    link.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        edit(element) 
    })
}

/**
 * Generate html for a dialogue to create/edit a link
 * @param {boolean} edit flag
 * @returns {string} HTML string
 */
function form(edit){
    let openBtn = ''
    let display = node.dataset.display ? node.dataset.display : 0
    if ( edit ) {
        openBtn = `(<a href="${node.dataset.href}" class="link" target="_blank" title="Open link in new tab or window">${Icons.openLink} Open</a>)`
    }
    return `
        <form class="arte-link">
            <div class="form-input">
                <label for="href">URL ${openBtn}</label>
                <input id="href" type="text" class="form-control" placeholder="URL" required value="${node.dataset.href}">
            </div>
            <div class="form-input">
                <label for="label">Label (optional)</label>
                <input id="label" type="text" class="form-control" placeholder="Label" value="${node.dataset.label}">
            </div>
            <div class="form-input">
                <label for="label">Display option</label>
                <select class="form-control" id="display">
                    <option value="0" ${display==0 ? 'selected' : ''}>Label only</option>
                    <option value="1" ${display==1 ? 'selected' : ''}>Link only</option>
                    <option value="2" ${display==2 ? 'selected' : ''}>Label and link</option>
                </select>
            </div>
        </form>`
}


/**
 * Optional method that, on first load of editor, converts the minimal custom 
 * HTML into the full editable version
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to use
 */
 const init = function( edt, btn ){
    editor = edt
    button = btn
    const links = editor.editorNode.querySelectorAll( TAG )
    links.forEach( link => format( link ))
}

/**
 * Mandatory button click function which displays the colour dialogue
 * for the supplied button
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to act on
 */
const click = function( edt, btn ){
    // Ignore if a modal is active
    if ( drawer && drawer.active() ){
        return
    }
    editor = edt
    button = btn
    if ( editor.range === false){
        // console.log('No range selected')
        return
    }
    // Get default label if range not collapsed
    let selectedText = ''
    if ( editor.range.collapsed == false && 
         editor.range.startContainer == editor.range.endContainer ){
        selectedText = editor.range.endContainer.textContent.substring(editor.range.startOffset, editor.range.endOffset)  
    }
    show( selectedText, false )
}

/**
 * Optional method to add event handlers to all custom links
 * @param {object} edt 
 */
const addEventHandlers = function(edt){
    editor = edt
    button = BUTTON
    const nodes = editor.editorNode.querySelectorAll(TAG)
    nodes.forEach( node => node.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        edit(node) 
    }))
}

/**
 * Optional method to reformat/clean the custom element as it should be saved in a file or database
 * @param {HTMLElement} node
 * @returns HTMLElement as cleaned
 */
const clean = function(node){
    // console.log('clean link',node)
    node.removeAttribute('contenteditable')
    node.removeAttribute('title')
    node.innerHTML = ''
    return node
}

/**
 * Set the disabled and active states of a button
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to act on
 */
 const setState = function( edt, btn ){
    if ( edt.range===false || 
         edt.range.rootNode == edt.editorNode || 
         Helpers.isList(edt.range.rootNode) ){
        btn.element.disabled = true
        btn.element.classList.remove('active')
    } else {
        btn.element.disabled = false
        const link = edt.range.blockParent.querySelector(TAG)
        if ( link != null ){
            btn.element.classList.add('active')
        } else {
            btn.element.classList.remove('active')
        }
    }
}

/**
 * Display custom html in the sidebar
 * @param {Object} edt 
 * @returns {Object} {icon,label,content}
 */
const sidebar = function(edt){
    const links = edt.editorNode.querySelectorAll(TAG)
    let content = ''
    links.forEach( link => {
        content += `
            <article>
                <a href="#${link.id}" title="Click to view link in context">
                    ${link.dataset.label} (${link.dataset.href})
                </a>
            </article>`
    })
    return {
        icon: Icons.link,
        label: 'links',
        content: `${content}`
    }
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const options = {init, setState, addEventHandlers, clean, sidebar}
export const BUTTON = new ToolbarButton( 'custom', TAG, 'Link', Icons.link, click, options ) 