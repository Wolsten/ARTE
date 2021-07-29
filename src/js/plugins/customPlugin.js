"use strict"

import * as Modal from './modalConfirm.js'
import ToolbarButton from './ToolbarButton.js'
import * as Icons from './icons.js'
import * as Helpers from '../helpers.js'

// A custom tag must be in upper case
const TAG = 'CUSTOM'

// Global variables reset on each click
let editorNode
let dirty
let range
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
 * @param {node} n The custom node to be edited
 * @returns 
 */
function edit( n ){
    // If we already have an active panel - ignore edit clicks
    if ( panel ){
        return
    }
    node = n
    editorNode = Helpers.getEditorNode(node)
    data = {
        id: node.id,
        property1: node.querySelector('.property1').innerText.trim(),
        property2: node.querySelector('.property2').innerText.trim(),
        property3: node.querySelector('.property3').innerText.trim(),
    }
    show(true)
}

/**
 * Triggered by clicking the button or the element in the editor
 * 
 * @param {boolean} edit True if clicked an existing custom element
 */
function show( edit ){
    panel = document.createElement('DIV')
    panel.id = 'custom-edit'
    panel.classList.add('edit-panel')
    panel.innerHTML = form(data, edit)
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
    if ( edit ){
        panel.querySelector('button.delete').addEventListener('click', () => {
            const confirmBtn = Modal.show('Delete custom item', 'Do you really want to delete this custom item?', 'No - keep', 'Yes - delete')
            confirmBtn.addEventListener( 'click', () => {
                Modal.hide()
                deleteItem() 
            })
        })
    }
    panel.querySelector('form').addEventListener('submit', event => {
        event.preventDefault()
        save()
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
function save(){
    console.log('Save changes')
    // Create new empty custom element and add to the editor?
    if ( data.id == '' ){
        data.id = Helpers.generateUid()
        insert()
    }
    // Save the (updated) properties 
    data.property1 = panel.querySelector('form #property1').value.trim()
    data.property2 = panel.querySelector('form #property2').value.trim()
    data.property3 = panel.querySelector('form #property3').value.trim()
    // Update the dom after a delay
    setTimeout( ()=>updateDom(), 10)
} 

/**
 * Insert a new custom element in the editor at the end of the current 
 * range's startContainer
 */
function insert(){
    //const 
    node = document.createElement(TAG)
    node.innerHTML = template(data)
    node.id = data.id
    node.setAttribute('contenteditable', 'false')
    node = range.startContainer.parentNode.appendChild(node)
}

/**
 * Update the custom element in the dom
 */
function updateDom(){
    // const form = panel.querySelector('form')
    // const node = editorNode.querySelector(`${TAG}#${data.id}`)
    node.querySelector('.property1').innerText = data.property1
    node.querySelector('.property2').innerText = data.property2
    node.querySelector('.property3').innerText = data.property3
    // Format node and add event handler
    format(node)
    // Close the edit pane
    hide()
}

function deleteItem(){
    // @todo Remove link from the editor
    const node = editorNode.querySelector(`${TAG}#${data.id}`)
    node.remove()
    hide()
    // Flag that the dom has been updated
    const event = new Event('editor-updated')
    editorNode.dispatchEvent(event)
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
    return n
}

/**
 * Format the given custom node and add click event handler
 * @param {node} n The custom node
 */
function format( n ){
    const id = n.id
    if ( n.id == false ){
        n.id = Helpers.generateUid()
    }
    data = {
        id: n.id,
        property1: n.querySelector('.property1').innerText,
        property2: n.querySelector('.property2').innerText,
        property3: n.querySelector('.property3').innerText,
    }
    n.innerHTML = template(data)
    n.setAttribute('contenteditable',false)
    n.addEventListener('click', event => {
        event.preventDefault()
        edit(n) 
    })
}

/**
 * Add event handlers to all custom nodes
 */
function addEventHandlers(editor){
    const nodes = editor.editorNode.querySelectorAll(TAG)
    nodes.forEach( n => n.addEventListener('click', event => {
        event.preventDefault()
        edit(n) 
    }))
}

/**
 * Form template
 * @param {*} props The form properties to be edited
 * @param {boolean} edit The edit flag used to configure title and add delete button 
 * @returns {string} Generated html
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
                        <label for="property1">URL</label>
                        <input id="property1" type="text" class="form-control" placeholder="Property 1" required value="${props.property1}">
                    </div>
                    <div class="form-input">
                        <label for="property2">URL</label>
                        <input id="property2" type="text" class="form-control" placeholder="Property 2" required value="${props.property2}">
                    </div>
                    <div class="form-input">
                        <label for="property3">URL</label>
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

// function generateUid(){
//     return Date.now().toString(36) + Math.random().toString(36).substr(2);
// }

function template(props){
    return `
        <span class="title">I am a custom object with 3 properties:</span>
        <span class="label">Property 1:</span><span class="prop property1">${props.property1}</span>
        <span class="label">Property 2:</span><span class="prop property2">${props.property2}</span>
        <span class="label">Property 3:</span><span class="prop property3">${props.property3}</span>
        <span class="advice">Click anywhere inside to edit. Select end of preceding text and then the Enter key to add block line after this custom element.</span>
    `
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const init = function( editor ){
    console.log('Initialising custom plugin')
    const customElements = editor.editorNode.querySelectorAll( TAG )
    customElements.forEach( element => format( element ) )
}

function click( editor ){
    if ( editor.range === false ){
        console.log('No range selected')
        return
    }
    range = editor.range
    editorNode = editor.editorNode
    // Get default label if range not collapsed
    let label = ''
    if ( range.collapsed == false && 
         range.startContainer == range.endContainer ){
        label = range.endContainer.textContent.substring(range.startOffset, range.endOffset)  
    }
    data = {
        id:'',
        property1:'',
        property2:'',
        property3:''
    }
    show(false)
}

const options = {addEventHandlers, clean}
const button = new ToolbarButton( 'custom', TAG, 'Custom', Icons.plugin, click, options ) 
export const buttons = [button]