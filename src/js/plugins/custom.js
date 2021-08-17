import * as Icons from '../icons.js'
import * as Helpers from '../helpers.js'
import ToolbarButton from '../ToolbarButton.js'
import * as ModalConfirm from '../modalConfirm.js'
import * as ModalEdit from '../modalEdit.js'

/**
 * @constant {string} TAG The HTMLElement tag as inserted in the dom for this custom node
 */
const TAG = 'CUSTOM'

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
 * Edit an existing custom node by extracting the data from the node and displaying
 * the edit form
 * 
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 * @param {HTMLElement} element The custom node to be edited
 */
function edit( editor, button, element ){
    // If we already have an active panel - ignore edit clicks
    if ( panel ){
        return
    }
    node = element
    show( editor, button, true)
}

/**
 * Show the custom dialogue.
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 * @param {boolean} editFlag Whether editing existing custom element or creating new
 */
function show( editor, button, editFlag ){
    let title = 'Edit custom element'
    if ( editFlag == false ){
        // Create a empty HTMLElement
        title = 'Create custom element'
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
    const html = form(data, editFlag)
    panel = ModalEdit.show( title, html )
    // Initialise confirmation module and dirty data detection
    dirty = false
    const inputs = panel.querySelectorAll('form input')
    inputs.forEach(input => input.addEventListener('change', () => dirty=true))
    // Handle button events
    panel.querySelector('button.cancel').addEventListener('click', () => {
        if ( dirty ){
            const confirmBtn = ModalConfirm.show('Cancel changes', 'Do you really want to lose these changes?')
            confirmBtn.addEventListener( 'click', () => {
                ModalConfirm.hide()
                ModalEdit.hide()
            })
        } else {
            ModalEdit.hide()
        }
    })
    if ( editFlag ){
        panel.querySelector('button.delete').addEventListener('click', () => {
            const confirmBtn = ModalConfirm.show('Delete custom item', 'Do you really want to delete this custom item?', 'No - keep', 'Yes - delete')
            confirmBtn.addEventListener( 'click', () => {
                ModalConfirm.hide()
                deleteItem(editor, button) 
            })
        })
    }
    panel.querySelector('form').addEventListener('submit', event => {
        event.preventDefault()
        save(editor, button, editFlag)
    })
    // Focus the first property
    const prop1 = panel.querySelector('form #property1')
    prop1.focus()
    prop1.setSelectionRange(prop1.value.length, prop1.value.length)
}

/**
 * Save the new or edited custom element
 * @param {object} editor A unique editor instance
 * @param {object} button The button clicked
 * @param {boolean} editFlag Flag whether to insert new or update existing link
 */
function save(editor, button, editFlag ){
    // console.log('Save changes')
    node.querySelector('.property1').innerText = panel.querySelector('form #property1').value.trim()
    node.querySelector('.property2').innerText = panel.querySelector('form #property2').value.trim()
    node.querySelector('.property3').innerText = panel.querySelector('form #property3').value.trim()
    if ( editFlag==false ){
        insert(editor, button)
    }
    // // Update the dom after a delay
    // setTimeout( ()=>updateDom(editor, button), 10)
    // Format node and add event handler
    format(editor, button, node)
    ModalEdit.hide()
    // Update state
    editor.range = Helpers.setCursor( node, 0)
    setState(editor, button)
} 

/**
 * Insert a new custom element in the editor at the end of the current 
 * range's startContainer
 * @param {object} editor A unique editor instance
 */
function insert(editor){
    node = editor.range.startContainer.parentNode.appendChild(node)
}

/**
 * Delete the custom element in the dom
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
function deleteItem(editor, button){
    //node = editor.editorNode.querySelector(`${TAG}#${data.id}`)
    node.remove()
    ModalEdit.hide()
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
    console.log('clean custom element',node)
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
 * @param {object} editor A unique editor instance
 * @param {object} button The button to use
 * @param {HTMLElement} element
 */
function format( editor, button, element ){
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
        edit(editor, button, element) 
    })
    element.appendChild(editButton)
    // Add set state listener
    element.addEventListener( 'click', ()=> {
        setState( editor, button )
    })
}

/**
 * Add event handlers to all custom node edit buttons
 * @param {object} editor A unique editor instance
 */
function addEventHandlers(editor){
    const buttons = editor.editorNode.querySelectorAll(TAG + ' button')
    buttons.forEach( button => button.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        const element = button.parentNode
        edit(editor, BUTTON, element)
    }))
}

/**
 * Form template
 * @param {string, string, string} props The form properties to be edited
 * @param {boolean} editFlag The edit flag used to configure title and add delete button 
 * @returns {string} Generated html
 */
function form(props,editFlag){
    let delBtn = ''
    if ( editFlag ) {
        delBtn = `<button type="button" class="delete">Delete</button>`
    }
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
            <div class="buttons">
                <button type="button" class="cancel">Cancel</button>
                ${delBtn}
                <button type="submit" class="save">Save</button>
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
 * @param {object} editor A unique editor instance
 * @param {object} button The button to use
 */
const init = function( editor, button ){
    //console.log('Initialising custom plugin')
    const customElements = editor.editorNode.querySelectorAll( TAG )
    customElements.forEach( element => format( editor, button, element ) )
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
        const custom = editor.range.blockParent.querySelector(TAG)
        if ( custom != null ){
            button.element.classList.add('active')
        } else {
            button.element.classList.remove('active')
        }
    }
}

/**
 * Mandatory button click function
 * @param {object} editor A unique editor instance
 * @param {object} btn The button to act on
 */
const click = function( editor, button ){
    // Ignore if a modal is active
    if ( editor.modalActive() ){
        return
    }
    const custom = editor.range.blockParent.querySelector(TAG)
    if ( custom != null ){
        edit(editor, button, custom)
    } else {
        show(editor, button, false)
    }
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const options = {setState, init, addEventHandlers, clean}
export const BUTTON = new ToolbarButton( 'custom', TAG, 'Custom', Icons.plugin, click, options ) 