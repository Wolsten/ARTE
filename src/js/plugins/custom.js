import * as Icons from '../icons.js'
import * as Helpers from '../helpers.js'
import ToolbarButton from '../ToolbarButton.js'
import Modal from '../Modal.js'

// -----------------------------------------------------------------------------
// @section Variables
// -----------------------------------------------------------------------------

/**
 * @constant {string} TAG The HTMLElement tag as inserted in the dom for this custom node
 */
const TAG = 'CUSTOM'

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
  * @var {Modal} panel The container for the edit dialogue
  */
let panel = null

 /**
  * @var {HTMLElement} confirm The container for the modal confirm dialogue
  */
let confirm = null

// -----------------------------------------------------------------------------
// @section Private methods
// -----------------------------------------------------------------------------

/**
 * Edit an existing custom node by extracting the data from the node and displaying
 * the edit form
 * 
 * @param {HTMLElement} element The custom node to be edited
 */
function edit( element ){
    // If we already have an active panel - ignore edit clicks
    if ( panel && panel.active() ){
        return
    }
    node = element
    show(true)
}

function handleConfirmCancel(){
    confirm.hide()
    panel.hide()
}

function handleConfirmDelete(){
    confirm.hide()
    panel.hide()
    deleteItem() 
}

function handleCancel(){
    if ( dirty ){
        confirm = new Modal({ 
            type:'confirm',
            severity:'warning',
            title:'Cancel changes', 
            html:'Do you really want to lose these changes?',
            buttons: {
                cancel: { label:'No - keep editing'},
                confirm: { label:'Yes - delete link', callback:handleConfirmCancel}
            }
        })
        confirm.show()
    } else {
        panel.hide()
    }
}

function handleDelete(){
    confirm = new Modal({ 
        type:'confirm',
        severity:'danger',
        title:'Delete changes', 
        html:'Do you really want to delete this item?',
        buttons: {
            cancel: { label:'No - keep editing'},
            confirm: { label:'Yes - delete link', callback:handleConfirmDelete }
        }
    })
    confirm.show()
}

/**
 * Show the custom dialogue.
 * @param {boolean} editFlag Whether editing existing custom element or creating new
 */
function show( editFlag ){
    let title = 'Create custom element'
    let buttons = {
        cancel:  { label:'Cancel', callback:handleCancel },
        confirm: { label:'Save', callback:save }
    }
    if ( editFlag ){
        title = 'Edit custom element'
        buttons.delete = { label:'Delete', callback:handleDelete }
    } else {
        node = document.createElement(TAG)
        node.id = Helpers.generateUid()
        node.setAttribute('contenteditable','false')
        node.innerHTML = template({property1:' ', property2:' ', property3:' '})
    }
    const data = {
        property1: node.querySelector('.property1').innerText,
        property2: node.querySelector('.property2').innerText,
        property3: node.querySelector('.property3').innerText,
    }
    // Create and display the modal panel
    panel = new Modal({type:'edit',title,html: form(data), buttons})
    panel.show()
    // Initialise confirmation module and dirty data detection
    dirty = false
    const inputs = panel.panel.querySelectorAll('form input')
    inputs.forEach(input => input.addEventListener('change', () => dirty=true))
    // Focus the first property
    const prop1 = panel.panel.querySelector('form input#property1')
    prop1.focus()
    prop1.setSelectionRange(prop1.value.length, prop1.value.length)
}

/**
 * Save the new or edited custom element
 */
function save(){
    // console.log('Save changes')
    node.querySelector('.property1').innerText = panel.panel.querySelector('form #property1').value.trim()
    node.querySelector('.property2').innerText = panel.panel.querySelector('form #property2').value.trim()
    node.querySelector('.property3').innerText = panel.panel.querySelector('form #property3').value.trim()
    if ( node.parentNode == null ){
        insert()
    }
    panel.hide()
    // Format node and add event handler
    format(node)
    // Update state
    editor.range = Helpers.setCursor( node, 0)
    setState(editor, button)
} 

/**
 * Insert a new custom element in the editor at the end of the current 
 * range's startContainer
 */
function insert(){
    node = editor.range.startContainer.parentNode.appendChild(node)
}

/**
 * Delete the custom element in the dom
 */
function deleteItem(){
    //node = editor.editorNode.querySelector(`${TAG}#${data.id}`)
    node.remove()
    // Update state
    editor.range = false
    setState(editor, button)
}

/**
 * Optional method to reformat/clean the custom element as it should be saved in a file or database
 * @param {HTMLElement} node
 * @returns HTMLElement as cleaned
 */
function clean(node){
    // console.log('clean custom element',node)
    // Remove the content editable flag and the ornamentation
    node.removeAttribute('contenteditable')
    node.querySelector('.title').remove()
    node.querySelector('.advice').remove()
    node.querySelector('.label').remove()
    node.querySelector('button').remove()
    return node
}

/**
 * Format the given custom element and add click event handler
 * @param {HTMLElement} element
 */
function format( element ){
    const id = element.id
    // Generate new id if required
    if ( element.id == false ){
        element.id = Helpers.generateUid()
    }
    // Element data
    const data = {
        property1: element.querySelector('.property1').innerText,
        property2: element.querySelector('.property2').innerText,
        property3: element.querySelector('.property3').innerText,
    }
    element.innerHTML = template(data)
    element.setAttribute('contenteditable',false)
    // Add edit button and listener
    const editButton = document.createElement('button')
    editButton.type = 'button'
    editButton.classList.add('edit')
    editButton.innerText = 'Edit'
    editButton.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        edit(element) 
    })
    element.appendChild(editButton)
    // Add set state listener
    element.addEventListener( 'click', ()=> {
        setState( editor, button )
    })
}

/**
 * Add event handlers to all custom node edit buttons
 * @param {object} edt An editor instance
 */
function addEventHandlers(edt){
    editor = edt
    button = BUTTON
    const buttons = editor.editorNode.querySelectorAll(TAG + ' button')
    buttons.forEach( button => button.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        const element = button.parentNode
        edit(element)
    }))
}

/**
 * Form template
 * @param {string, string, string} props The form properties to be edited
 * @returns {string} Generated html
 */
function form(props){
    return `
        <form>
            <div class="form-input">
                <label for="property1">Property 1</label>
                <input id="property1" type="text" class="form-control" placeholder="Property 1" required value="${props.property1}">
            </div>
            <div class="form-input">
                <label for="property2">Property 2</label>
                <input id="property2" type="text" class="form-control" placeholder="Property 2" required value="${props.property2}">
            </div>
            <div class="form-input">
                <label for="property3">Property 3</label>
                <input id="property3" type="text" class="form-control" placeholder="Property 3" required value="${props.property3}">
            </div>
        </form>`
}

/**
 * 
 * @param {string,string,string} props The properties to display
 * @returns {string} HTML text to display
 */
function template(props){
    return `
        <span class="title">I am a custom object with 3 properties:</span>
        <span class="label">Property 1:</span><span class="prop property1">${props.property1}</span>
        <span class="label">Property 2:</span><span class="prop property2">${props.property2}</span>
        <span class="label">Property 3:</span><span class="prop property3">${props.property3}</span>
        <span class="advice">Click the top right-hand button to edit. Select anywhere in the element and then the Enter key to add a new line after this custom element.</span>
    `
}

/**
 * On first load of editor, convert the minimal custom HTML into the full
 * editable version
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to use
 */
const init = function( edt, btn ){
    editor = edt
    button = btn
    const customElements = edt.editorNode.querySelectorAll( btn.tag )
    customElements.forEach( element => format( element ) )
}

/**
 * Set the disabled and active states of a button
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to act on
 */
const setState = function( edt, btn ){
    if ( edt.range === false  || 
        (edt.range.collapsed==false && edt.range.startContainer != edt.range.endContainer) ){
        btn.element.disabled = true
        btn.element.classList.remove('active')
    } else {
        btn.element.disabled = false
        const custom = edt.range.blockParent.querySelector(TAG)
        if ( custom != null ){
            btn.element.classList.add('active')
        } else {
            btn.element.classList.remove('active')
        }
    }
}

/**
 * Mandatory button click function
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to act on
 */
const click = function( edt, btn ){
    // Ignore if a modal is active
    if ( panel && panel.active() ){
        return
    }
    editor = edt
    button = btn
    const custom = editor.range.blockParent.querySelector(TAG)
    if ( custom != null ){
        edit(custom)
    } else {
        show(false)
    }
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const options = {setState, init, addEventHandlers, clean}
export const BUTTON = new ToolbarButton( 'custom', TAG, 'Custom', Icons.plugin, click, options ) 