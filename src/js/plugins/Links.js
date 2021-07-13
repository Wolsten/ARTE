"use strict"

import * as Modal from './modalConfirm.js'
import ToolbarButton from './ToolbarButton.js'
import * as Icons from './icons.js'

let editorNode
let dirty
let range
let panel = null
let linkData 

function init( target ){
    editorNode = target
    dirty = false
    let links = editorNode.querySelectorAll( 'a' )
    links.forEach( link => format( link ))
}

function click( rng ){
    console.log('click link')
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
    linkData = {
        id:'',
        href:'', 
        label, 
    }
    show(false)
}

function edit( domLink ){
    // If we already have an active panel - ignore clicks on links
    if ( panel ){
        return
    }
    linkData = {
        id: domLink.id,
        href: domLink.href,
        label: domLink.innerText.trim(),
    }
    show(true)
}

function show( edit ){
    panel = document.createElement('DIV')
    panel.id = 'link-edit'
    panel.classList.add('edit-panel')
    panel.innerHTML = form(linkData, edit)
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

// -----------------------------------------------------------------------------
// @section Save changes
// -----------------------------------------------------------------------------

function save(){
    console.log('Save changes')
    // Create new link and add to the editor?
    if ( linkData.id == '' ){
        linkData.id = generateUid()
        linkData.href = panel.querySelector('form #href').value.trim()
        insert()
    }
    setTimeout( ()=>updateDomDelayed(), 10)
} 

function insert(){
    const domLink = document.createElement('a')
    domLink.id = linkData.id
    domLink.href = linkData.href
    domLink.setAttribute('contenteditable', 'false')
    domLink.innerText = ' '
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
    parent.insertBefore(domLink, range.startContainer)
    if ( postText ) {
        parent.insertBefore(document.createTextNode(postText), range.startContainer)
    }
    range.startContainer.remove()
}

function updateDomDelayed(){
    // Update dom
    const form = panel.querySelector('form')
    const domLink = editorNode.querySelector(`a#${linkData.id}`)
    domLink.href = form.querySelector('#href').value.trim()
    let label = form.querySelector('#label').value.trim()
    if ( label == '' ){
        label = domLink.href
    }
    domLink.innerText = label
    // Add event handler
    format(domLink)
    // Close the edit pane
    hide()
}



// -----------------------------------------------------------------------------
// @section Delete link
// -----------------------------------------------------------------------------

function deleteItem(){
    // @todo Remove link from the editor
    const domLink = editorNode.querySelector(`a#${linkData.id}`)
    domLink.remove()
    hide()
}

// -----------------------------------------------------------------------------
// @section Clear panel
// -----------------------------------------------------------------------------


// function delayedRemove(){
//     panel.remove()
//     panel = null
// }

function hide(){
    panel.classList.remove('show')
    panel.remove()
    panel = null
    // setTimeout( ()=>delayedRemove(), 500 )
}

// function getNewNode(node){
//     let matched = false
//     while ( !matched  ){
//         if ( node.tagName === 'A' ){
//             matched = node
//         }
//         node = node.parentNode
//     }
//     return matched
// }



function clean(node){
    console.log('clean link',node)
    node.removeAttribute('id')
    node.removeAttribute('contenteditable')
    return node
}

function format( domLink ){
    // Click event handling - first time and after reformatting
    domLink.id = generateUid()
    domLink.setAttribute('contenteditable',false)
    domLink.addEventListener('click', event => {
        event.preventDefault()
        edit(domLink) 
    })
}

function addEventHandlers(){
    const domLinks = editorNode.querySelectorAll('a')
    domLinks.forEach( domLink => domLink.addEventListener('click', event => {
        event.preventDefault()
        edit(domLink) 
    }))
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
// @section Exports
// -----------------------------------------------------------------------------


const options = {init, addEventHandlers, clean}
const button = new ToolbarButton( 'custom', 'A', 'Link', Icons.link, click, options ) 
export const buttons = [button]