"use strict"

import * as Modal from './modalConfirm.js'
import ToolbarButton from './ToolbarButton.js'
import * as Icons from './icons.js'
import * as Helpers from '../helpers.js'

// Tag name for this plugin
const TAG = 'A'

// Set in init method
let editorNode
let dirty
let range
let panel = null
let data 
let node



// -----------------------------------------------------------------------------
// @section Private methods
// -----------------------------------------------------------------------------

function edit( n ){
    // If we already have an active panel - ignore clicks on links
    if ( panel ){
        return
    }
    node = n
    editorNode = Helpers.getEditorNode(node)
    data = {
        id: node.id,
        href: node.href,
        label: node.innerText.trim(),
    }
    show(true)
}

function show( edit ){
    panel = document.createElement('DIV')
    panel.id = 'link-edit'
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
            const confirmBtn = Modal.show('Delete link', 'Do you really want to delete this link?')
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
    const href = panel.querySelector('form #href')
    href.focus()
    href.setSelectionRange(href.value.length, href.value.length)
    // Add transition class
    setTimeout( ()=>panel.classList.add('show'),10 )
}

function save(){
    console.log('Save changes')
    // Create new link and add to the editor?
    if ( data.id == '' ){
        data.id = generateUid()
        data.href = panel.querySelector('form #href').value.trim()
        insert()
    }
    setTimeout( ()=>updateDom(), 10)
} 

function insert(){
    node = document.createElement(TAG)
    node.id = data.id
    node.href = data.href
    node.setAttribute('contenteditable', 'false')
    node.innerText = ' '
    const parent = range.startContainer.parentNode
    let preText = range.startContainer.textContent.substring(0,range.startOffset)
    let postText
    if ( range.collapsed ){
        postText = range.startContainer.textContent.substring(range.startOffset)
        // Insert leading and trailing spaces if needed
        if ( preText.charAt(preText.length+1) != ' ' ){
            preText = preText + ' '
        }
        if ( postText.charAt(0) != ' ' ){
            postText = ' ' + postText
        }
    } else {
        postText = range.startContainer.textContent.substring(range.endOffset)
    }
    if ( preText ) {
        parent.insertBefore(document.createTextNode(preText), range.startContainer)
    }
    parent.insertBefore(node, range.startContainer)
    if ( postText ) {
        parent.insertBefore(document.createTextNode(postText), range.startContainer)
    }
    range.startContainer.remove()
}

function updateDom(){
    const form = panel.querySelector('form')
    node.href = form.querySelector('#href').value.trim()
    let label = form.querySelector('#label').value.trim()
    if ( label == '' ){
        label = domLink.href
    }
    node.innerText = label
    // Add event handler
    format(node)
    // Close the edit pane
    hide()
    // Update the buffer. Ignored if no buffering set
    editorNode.dataset.editor.buffer.update()
}

function deleteItem(){
    const node = editorNode.querySelector(`${TAG}#${data.id}`)
    node.remove()
    hide()
    // Update the buffer. Ignored if no buffering set
    editorNode.dataset.editor.buffer.update()
}

function hide(){
    panel.classList.remove('show')
    panel.remove()
    panel = null

}


function format( node ){
    // Click event handling - first time and after reformatting
    node.id = generateUid()
    node.setAttribute('contenteditable',false)
    node.addEventListener('click', event => {
        event.preventDefault()
        edit(node) 
    })
}



function form(link,edit){
    let title = 'Create link'
    let delBtn = ''
    let href = 'http://'
    let label = link.label
    if ( edit) {
        title = 'Edit link'
        delBtn = `<button type="button" class="delete">Delete</button>`
        href = link.href
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
                        <input id="href" type="url" class="form-control" placeholder="URL" required value="${href}">
                    </div>
                    <div class="form-input">
                        <label for="label">Label (optional)</label>
                        <input id="label" type="text" class="form-control" placeholder="Label" value="${label}">
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

// -----------------------------------------------------------------------------
// @section Interface
// -----------------------------------------------------------------------------

export const init = function( editor ){
    editorNode = editor.editorNode
    let links = editorNode.querySelectorAll( TAG )
    links.forEach( link => format( link ))
}

function click( editor ){
    console.log('click link')
    if ( editor.range === false){
        console.log('No range selected')
        return
    }
    range = editor.range
    // Get default label if range not collapsed
    let label = ''
    if ( range.collapsed == false && 
         range.startContainer == range.endContainer ){
        label = range.endContainer.textContent.substring(range.startOffset, range.endOffset)  
    }
    data = {
        id:'',
        href:'', 
        label, 
    }
    show(false)
}

function addEventHandlers(editor){
    const nodes = editor.editorNode.querySelectorAll(TAG)
    nodes.forEach( node => node.addEventListener('click', event => {
        event.preventDefault()
        edit(node) 
    }))
}

function clean(node){
    console.log('clean link',node)
    node.removeAttribute('id')
    node.removeAttribute('contenteditable')
    return node
}

const options = {addEventHandlers, clean}
const button = new ToolbarButton( 'custom', TAG, 'Link', Icons.link, click, options ) 
export const buttons = [button]