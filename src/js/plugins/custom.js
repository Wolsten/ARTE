"use strict"

import * as Modal from '../modalConfirm.js'
import ToolbarButton from '../ToolbarButton.js'
import * as Icons from '../icons.js'
import * as Helpers from '../helpers.js'

// A custom tag must be in upper case
const TAG = 'CUSTOM'

// Global variables
let dirty
let panel = null
let data
let node

// -----------------------------------------------------------------------------
// @section Private methods
// -----------------------------------------------------------------------------

/**
 * Edit an existing custom node by extracting the data from the node and displaying
 * the edit form
 * 
 * @param {node} element The custom node to be edited
 * @returns 
 */
function edit( editor, button, element ){
    // If we already have an active panel - ignore edit clicks
    if ( panel ){
        return
    }
    node = element
    data = {
        id: node.id,
        property1: node.querySelector('.property1').innerText.trim(),
        property2: node.querySelector('.property2').innerText.trim(),
        property3: node.querySelector('.property3').innerText.trim(),
    }
    show( editor, button, true)
}


function show( editor, button, editFlag ){
    panel = document.createElement('DIV')
    panel.id = 'custom-edit'
    panel.classList.add('edit-panel')
    panel.innerHTML = form(data, editFlag)
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
            const confirmBtn = Modal.show('Delete custom item', 'Do you really want to delete this custom item?', 'No - keep', 'Yes - delete')
            confirmBtn.addEventListener( 'click', () => {
                Modal.hide()
                deleteItem(editor, button) 
            })
        })
    }
    panel.querySelector('form').addEventListener('submit', event => {
        event.preventDefault()
        save(editor, button)
    })
    // Add to dom, position and focus the input
    document.querySelector('body').appendChild(panel)
    const prop1 = panel.querySelector('form #property1')
    prop1.focus()
    prop1.setSelectionRange(prop1.value.length, prop1.value.length)
    // Add transition class
    setTimeout( ()=>panel.classList.add('show'), 10 )
}

/**
 * Save the new or edited custom node
 */
function save(editor, button){
    console.log('Save changes')
    // Create new empty custom element and add to the editor?
    if ( data.id == '' ){
        data.id = Helpers.generateUid()
        insert(editor, button)
    }
    // Save the (updated) properties 
    data.property1 = panel.querySelector('form #property1').value.trim()
    data.property2 = panel.querySelector('form #property2').value.trim()
    data.property3 = panel.querySelector('form #property3').value.trim()
    // Update the dom after a delay
    setTimeout( ()=>updateDom(editor, button), 10)
    // Update state
    editor.range = Helpers.setCursor( node, 0)
    setState(editor, button)
} 

/**
 * Insert a new custom element in the editor at the end of the current 
 * range's startContainer
 */
function insert(editor, button){
    // const 
    node = document.createElement(TAG)
    node.innerHTML = template(data)
    node.id = data.id
    node.setAttribute('contenteditable', 'false')
    node = editor.range.startContainer.parentNode.appendChild(node)
    // Update state
    editor.range = Helpers.setCursor( node, 0)
    setState(editor, button)
}

/**
 * Update the custom element in the dom
 */
function updateDom(editor, button){
    // const form = panel.querySelector('form')
    // const node = editorNode.querySelector(`${TAG}#${data.id}`)
    node.querySelector('.property1').innerText = data.property1
    node.querySelector('.property2').innerText = data.property2
    node.querySelector('.property3').innerText = data.property3
    // Format node and add event handler
    format(editor, button, node)
    // Close the edit pane
    hide()
}

function deleteItem(editor, button){
    // @todo Remove link from the editor
    const node = editor.editorNode.querySelector(`${TAG}#${data.id}`)
    node.remove()
    hide()
    // Update state
    editor.range = false
    setState(editor, button)
}

function hide(){
    panel.classList.remove('show')
    panel.remove()
    panel = null

}

/**
 * Optional method to reformat/clean the custom element as it should be saved in a file or database
 * @param {node} n
 * @returns node as cleaned
 */
function clean(n){
    console.log('clean custom element',n)
    // Remove the content editable flag and the ornamentation
    n.removeAttribute('contenteditable')
    n.querySelector('.title').remove()
    n.querySelector('.advice').remove()
    n.querySelector('.label').remove()
    n.querySelector('button').remove()
    return n
}

/**
 * Format the given custom node and add click event handler
 * @param node n The custom node
 */
function format( editor, button, element ){
    const id = element.id
    // Generate new id if required
    if ( element.id == false ){
        element.id = Helpers.generateUid()
    }
    // Define the custom element
    data = {
        id: element.id,
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
 */
function addEventHandlers(editor){
    const buttons = editor.editorNode.querySelectorAll(TAG + ' button')
    buttons.forEach( button => button.addEventListener('click', event => {
        event.preventDefault()
        const element = button.parentNode
        edit(editor, BUTTON, element) 
    }))
}

/**
 * Form template
 * @param {property1, property2, property3} props The form properties to be edited
 * @param boolean edit The edit flag used to configure title and add delete button 
 * @returns string Generated html
 */
function form(props,edit){
    let title = 'Create custom element'
    let delBtn = ''
    if ( edit ) {
        title = 'Edit custom element'
        delBtn = `<button type="button" class="delete">Delete</button>`
    }
    return `
        <div class="edit-panel-container">
            <div class="edit-panel-header">
                <h3 class="edit-panel-title">${title}</h3>
            </div>
            <div class="edit-panel-body">
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
                </form>
            </div>
        </div>`
}

function template(props){
    return `
        <span class="title">I am a custom object with 3 properties:</span>
        <span class="label">Property 1:</span><span class="prop property1">${props.property1}</span>
        <span class="label">Property 2:</span><span class="prop property2">${props.property2}</span>
        <span class="label">Property 3:</span><span class="prop property3">${props.property3}</span>
        <span class="advice">Click the top right-hand button to edit. Select anywherw in the element and then the Enter key to add a new line after this custom element.</span>
    `
}



// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const init = function( editor, button ){
    //console.log('Initialising custom plugin')
    const customElements = editor.editorNode.querySelectorAll( TAG )
    customElements.forEach( element => format( editor, button, element ) )
}

const setState = function( editor, button ){
    if ( editor.range === false ){
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

const click = function( editor, button ){
    const custom = editor.range.blockParent.querySelector(TAG)
    if ( custom != null ){
        edit(editor, button, custom)
    } else {
        // Get default label if range not collapsed
        let label = ''
        if ( editor.range.collapsed == false && 
            editor.range.startContainer == editor.range.endContainer ){
            label = editor.range.endContainer.textContent.substring(editor.range.startOffset, editor.range.endOffset)  
        }
        data = {
            id:'',
            property1:'',
            property2:'',
            property3:''
        }
        show(editor, button, false)
    }
}

const options = {setState, init, addEventHandlers, clean}
export const BUTTON = new ToolbarButton( 'custom', TAG, 'Custom', Icons.plugin, click, options ) 