"use strict"

import * as Modal from './modalConfirm.js'
import ToolbarButton from './ToolbarButton.js'
import * as Icons from './icons.js'

let editorNode
let dirty
let range
let panel = null
let data 
// A custom tag must be in upper case
const TAG = 'CUSTOM'

function init( target ){
    editorNode = target
    dirty = false
    let customs = editorNode.querySelectorAll( TAG )
    customs.forEach( custom => format( custom ))
}

function click( rng ){
    console.log('click custom')
    if ( range === false){
        console.log('No range selected')
        return
    }
    range = rng
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

function edit( node ){
    // If we already have an active panel - ignore clicks on links
    if ( panel ){
        return
    }
    data = {
        id: node.id,
        property1: node.querySelector('.property1').innerText.trim(),
        property2: node.querySelector('.property2').innerText.trim(),
        property3: node.querySelector('.property3').innerText.trim(),
    }
    show(true)
}

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
            const confirmBtn = Modal.show('Delete custom item', 'Do you really want to delete this custom item?')
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
    setTimeout( ()=>panel.classList.add('show'),10 )
}

// -----------------------------------------------------------------------------
// @section Save changes
// -----------------------------------------------------------------------------

function save(){
    console.log('Save changes')
    // Create new empty custom element and add to the editor?
    if ( data.id == '' ){
        data.id = generateUid()
        insert()
    }
    // Save the (updated) properties 
    data.property1 = panel.querySelector('form #property1').value.trim()
    data.property2 = panel.querySelector('form #property2').value.trim()
    data.property3 = panel.querySelector('form #property3').value.trim()
    // Update the dom after a delay
    setTimeout( ()=>updateDomDelayed(), 10)
} 

function insert(){
    const node = document.createElement(TAG)
    node.innerHTML = template(data)
    node.id = data.id
    node.setAttribute('contenteditable', 'false')
    range.startContainer.parentNode.appendChild(node)
}

function updateDomDelayed(){
    // Update dom
    const form = panel.querySelector('form')
    const node = editorNode.querySelector(`${TAG}#${data.id}`)
    node.querySelector('.property1').innerText = data.property1
    node.querySelector('.property2').innerText = data.property2
    node.querySelector('.property3').innerText = data.property3
    // Add event handler
    format(node)
    // Close the edit pane
    hide()
}



// -----------------------------------------------------------------------------
// @section Delete link
// -----------------------------------------------------------------------------

function deleteItem(){
    // @todo Remove link from the editor
    const domLink = editorNode.querySelector(`a#${data.id}`)
    domLink.remove()
    hide()
}

// -----------------------------------------------------------------------------
// @section Clear panel
// -----------------------------------------------------------------------------


function hide(){
    panel.classList.remove('show')
    panel.remove()
    panel = null
}

function clean(node){
    console.log('clean custom element',node)
    node.removeAttribute('contenteditable')
    return node
}

function format( node ){
    const id = node.id
    if ( node.id == false ){
        node.id = generateUid()
    }
    data = {
        id: node.id,
        property1: node.querySelector('.property1').innerText,
        property2: node.querySelector('.property2').innerText,
        property3: node.querySelector('.property3').innerText,
    }
    node.innerHTML = template(data)
    node.setAttribute('contenteditable',false)
    node.addEventListener('click', event => {
        event.preventDefault()
        edit(node) 
    })
}

function addEventHandlers(){
    const nodes = editorNode.querySelectorAll('TAG')
    nodes.forEach( node => node.addEventListener('click', event => {
        event.preventDefault()
        edit(node) 
    }))
}

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

function generateUid(){
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function template(props){
    return `
        <span class="title">I am a custom object with 3 properties (click me to edit):</span>
        <span class="label">Property 1: </span><span class="prop property1">${props.property1}</span>
        <span class="label">Property 2: </span><span class="prop property2">${props.property2}</span>
        <span class="label">Property 3: </span><span class="prop property3">${props.property3}</span>
    `
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------


const options = {init, addEventHandlers, clean}
const button = new ToolbarButton( 'custom', TAG, 'Custom', Icons.plugin, click, options ) 
export const buttons = [button]