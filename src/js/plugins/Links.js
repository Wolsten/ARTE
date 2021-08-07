"use strict"

/** Create active links, ie. links which can be edited rather than a normal html */

import * as Modal from '../modalConfirm.js'
import ToolbarButton from '../ToolbarButton.js'
import * as Icons from '../icons.js'
import * as Helpers from '../helpers.js'

// Tag name for this plugin
const TAG = 'A'

// Set in init method
let node
let editorNode
let dirty
let range
let selectedText = ''
let panel = null


// -----------------------------------------------------------------------------
// @section Private methods
// -----------------------------------------------------------------------------

function edit( link ){
    // If we already have an active panel - ignore clicks on links
    if ( panel ){
        return
    }
    // Save the clicked link
    node = link
    show(true)
}

function show( edit ){
    if ( edit == false ){
        node = document.createElement(TAG)
        node.href = ''
        node.dataset.label = selectedText
        node.dataset.display = 0
    }
    panel = document.createElement('DIV')
    panel.id = 'link-edit'
    panel.classList.add('edit-panel')
    panel.innerHTML = form( edit )
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
        save( edit )
    })
    // Add to dom, position and focus the input
    document.querySelector('body').appendChild(panel)
    const href = panel.querySelector('form #href')
    href.focus()
    href.setSelectionRange(href.value.length, href.value.length)
    // Add transition class
    setTimeout( ()=>panel.classList.add('show'),10 )
}

function save( edit ){
    console.log('Save changes')
    node.href = panel.querySelector('form #href').value.trim()
    node.dataset.label = panel.querySelector('form #label').value.trim()
    node.dataset.display = parseInt(panel.querySelector('form #display').value)
    if ( edit==false ){
        insert()
    }
    // Format link and add event handler
    format(node)
    hide()
} 




/**
 * Update the selected container with the new link
 */
function insert(){
    const parent = range.startContainer.parentNode
    // Get any pretext pr post text in the current container that is not selected
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
    // Insert pretext before the current container
    if ( preText ) {
        parent.insertBefore(document.createTextNode(preText), range.startContainer)
    }
    // Insert the node before the current container
    node = parent.insertBefore(node, range.startContainer)
    // Insert post text before the current container
    if ( postText ) {
        parent.insertBefore(document.createTextNode(postText), range.startContainer)
    }
    // Remove the pre-existing container
    range.startContainer.remove()
}

function deleteItem(){
    const node = editorNode.querySelector(`${TAG}#${data.id}`)
    node.remove()
    hide()
}

function hide(){
    panel.classList.remove('show')
    panel.remove()
    panel = null 
}

function label(link){
    switch (parseInt(link.dataset.display)){
        case 0:
            // Label is an optional parameter
            if ( link.dataset.label ){
                return link.dataset.label
            }
            break
        case 1:
            return link.href
        case 2:
            if ( link.dataset.label && link.dataset.label != link.href ){
                return `${link.dataset.label} (${link.href})`
            }
    }
    return link.href
}

/**
 * The format of a source link xml node is:
 * 
 * <a href="href" data-label="label" data-display="0|1|2"> </a>
 * 
 * The format of a editor link html node is:
 * 
 * <a href="href" id="unique-editor-id" data-label="label" data-display="0|1|2" contenteditable="false">label|link|label (link)</a>
 * 
 * @param {*} The custom source link xml
 */
function format( link ){
    // Click event handling - first time and after reformatting
    link.id = Helpers.generateUid()
    link.setAttribute('contenteditable',false)
    link.title = 'Click to edit'
    link.innerText = label(link)
    link.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        edit(link) 
    })
}

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
        openBtn = `<a href="${href}" target="_blank" title="Open link in new tab or window">${Icons.openLink}</a>`
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

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const init = function( editor ){
    editorNode = editor.editorNode
    let links = editorNode.querySelectorAll( TAG )
    links.forEach( link => format( link ))
}

function click( editor, btn ){
    console.log('click link')
    if ( editor.range === false){
        console.log('No range selected')
        return
    }
    range = editor.range
    // Get default label if range not collapsed
    selectedText = ''
    if ( range.collapsed == false && 
         range.startContainer == range.endContainer ){
            selectedText = range.endContainer.textContent.substring(range.startOffset, range.endOffset)  
    }
    show( false )
}

function addEventHandlers(editor){
    const nodes = editor.editorNode.querySelectorAll(TAG)
    nodes.forEach( node => node.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        edit( node ) 
    }))
}

function clean(node){
    console.log('clean link',node)
    node.removeAttribute('id')
    node.removeAttribute('contenteditable')
    // Clear inner text because label saved in dataset
    node.innerText = ' '
    return node
}

const options = {addEventHandlers, clean}
const button = new ToolbarButton( 4, 'custom', TAG, 'Link', Icons.link, click, options ) 
export const buttons = [button]