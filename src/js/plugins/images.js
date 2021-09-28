/** 
 * Insert/edit image tags
 * 
 * File format:
 * <arte-image id="id" data-src="src" data-alt="alt" data-caption="caption"></arte-image>
 * 
 * Editor format:
 * <arte-image id="id" data-src="src" data-alt="alt" data-caption="caption" 
 *             contenteditable="false" title="Click to edit">
 *      <img src="src" alt="alt"/>
 *      [<span class="caption">caption</span>]
 * </arte-image>
 * 
 * Sidebar format:
 * <article>
 *      <img id="id" src="url" alt="alt" title="Click to find in document"/>
 * </article>
 */

 import ToolbarButton from '../ToolbarButton.js'
 import * as Icons from '../icons.js'
 import * as Helpers from '../helpers.js'
 import Modal from '../Modal.js'
 
/**
 * @constant {string} TAG The HTMLElement tag as inserted in the dom for this custom node
 */
const TAG = 'ARTE-IMAGE'
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
 
/**
 * Action cancelling changes
 */
function handleConfirmCancel(){
    confirm.hide()
    drawer.hide()
}
 
/**
 * Ask to confirm cancelling changes
 */
function handleCancel(){
    if ( dirty ){
        confirm = new Modal({ 
            type:'overlay',
            severity:'warning',
            title: 'Cancel changes',
            html:'Do you really want to lose these changes?',
            buttons: {
                cancel: { label:'No - keep editing'},
                confirm: { label:'Yes - lose changes', callback:handleConfirmCancel}
            }
        })
        confirm.show()
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
 
/**
 * Action delete
 */
function handleConfirmDelete(){
    confirm.hide()
    drawer.hide()
    deleteItem() 
}
 
/**
 * Ask to confirm delete
 */
function handleDelete(){
    confirm = new Modal({ 
        type:'overlay',
        severity:'warning',
        title:'Delete image?',
        html:'Do you really want to delete this image?',
        buttons: {
            cancel: { label:'No - keep editing'},
            confirm: { label:'Yes - delete image', callback:handleConfirmDelete }
        }
    })
    confirm.show()
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
    show(true)
}
 
 /**
  * Show the image edit dialogue
  * @param {boolean} editFlag flag indicating whether to edit or create new
  */
function show( editFlag ){
    let title = 'Insert image'
    let buttons = {
        cancel: { label:'Cancel', callback:handleCancel },
        confirm: { label:'Save', callback:()=>save(editFlag) }
    }
    if ( editFlag ){
        title = 'Edit image'
        buttons.delete = { label:'Delete', callback:handleDelete }
    } else {
        node = document.createElement(TAG)
        node.id = Helpers.generateUid()
        node.setAttribute('contenteditable','false')
        node.dataset.src = ''
        node.dataset.alt = ''
    }
    // Create and display the modal panel
    drawer = new Modal({
        type:'drawer',
        title,
        html: form(editFlag), 
        buttons,
    escape:true})
    drawer.show()
    // Initialise confirmation module and dirty data detection
    dirty = false
    const inputs = drawer.panel.querySelectorAll('form input')
    inputs.forEach(input => input.addEventListener('change', () => dirty=true))
    // Focus the src
    const src = drawer.panel.querySelector('form #src')
    src.focus()
    src.setSelectionRange(src.value.length, src.value.length)
}
 
 /**
  * Save the changes set in the dialogue
  * @param {boolean} editFlag
  */
function save(editFlag=false){
    // console.log('Save changes')
    node.dataset.src = drawer.panel.querySelector('form #src').value.trim()
    node.dataset.caption = drawer.panel.querySelector('form #caption').value.trim()
    node.dataset.alt = drawer.panel.querySelector('form #alt').value.trim()
    // Check whether to insert new arte image
    if ( editFlag == false ){
        editor.range.blockParent.appendChild(node)
    }
    drawer.hide()
    // Format image and add event handler
    format(node)
    // Update state
    editor.range = Helpers.setCursor( node, 0 )
    setState(editor, button)
    editor.buffer()
}
 
 
/**
 * Format an image tag
 * @param {HTMLElement} element
 */
function format( element ){
    console.log('arte-image', element)
    // Generate new id if required
    if ( element.id == false ){
        element.id = Helpers.generateUid()
    }
    element.setAttribute('contenteditable',false)
    element.title = 'Click to edit'
    // Initialise
    element.innerHTML = ''
    // img tag
    const img = document.createElement('img')
    img.src = element.dataset.src
    img.alt = element.dataset.alt
    element.appendChild(img)
    // caption?
    if ( element.dataset.caption != '' ){
        const caption = document.createElement('caption')
        caption.innerText = element.dataset.caption
        element.appendChild(caption)
    }
    element.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        edit(element) 
    })
}
 
/**
 * Generate html for a dialogue to create/edit an image tag
 * @param {boolean} edit flag
 * @returns {string} HTML string
 */
function form(edit){
    return `
        <form class="arte-image">
            <p class="advice">Please enter a URL and optional caption for an image file:
            <div class="form-input">
                <label for="src">URL</label>
                <input id="src" type="text" class="form-control" placeholder="Source URL" required value="${node.dataset.src}">
            </div>
            <div class="form-input">
                <label for="caption">Caption</label>
                <input id="caption" type="text" class="form-control" placeholder="Caption for image" value="${node.dataset.caption}">
            </div>
            <div class="form-input">
                <label for="alt">Alt text</label>
                <input id="alt" type="text" class="form-control" placeholder="Alt text for image" value="${node.dataset.alt}">
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
    const elements = editor.editorNode.querySelectorAll( TAG )
    elements.forEach( item => format( item ))
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
    show( false )
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
    console.warn('clean image',node)
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
    console.log('Updating image sidebar')
    const elements = edt.editorNode.querySelectorAll(TAG)
    let content = ''
    elements.forEach( element => {
        const img = element.querySelector('img')
        content += `
            <a href="#${element.id}">
                <img src="${img.src}" alt="${img.alt}" title="Click to view image in document"/>
            </a>`
    })
    return {
        icon: Icons.image,
        label: 'images',
        content: `${content}`
    }
}
 
 // -----------------------------------------------------------------------------
 // @section Exports
 // -----------------------------------------------------------------------------
 
 const options = {init, setState, addEventHandlers, clean, sidebar}
 export const BUTTON = new ToolbarButton( 'custom', TAG, 'Image', Icons.image, click, options ) 