"use strict"

import * as Utils from '../../js/utils.js'
import CustomConfirm from '../../js/CustomConfirm.js'
import * as Navigator from '../../js/navigator.js'
import * as Icons from '../../js/icons.js'

let modal
let editPane            // The offcanvas div
let bsOffcanvas         // The bootstrap object version of the editPane
let currentLink = false // Link being edited or created
let editorNode
let savedRange

const insert = function(id){
    const link = document.createElement('a')
    link.id = id
    link.setAttribute('contenteditable', 'false')
    link.innerText = ' '
    const parent = savedRange.startContainer.parentNode
    const preText = savedRange.startContainer.textContent.substring(0,savedRange.startOffset)
    let postText
    if ( savedRange.collapsed ){
        postText = savedRange.startContainer.textContent.substring(savedRange.startOffset)
    } else {
        postText = savedRange.startContainer.textContent.substring(savedRange.endOffset)
    }
    if ( preText ) {
        parent.insertBefore(document.createTextNode(preText), savedRange.startContainer)
    }
    parent.insertBefore(link, savedRange.startContainer)
    if ( postText ) {
        parent.insertBefore(document.createTextNode(postText), savedRange.startContainer)
    }
    savedRange.startContainer.remove()
}

const saveChanges = function(){
    console.log('Save changes')
    const userForm = editPane.querySelector('form')
    // Create new link and add to the editor?
    if ( currentLink.id == '' ){
        currentLink.id = Utils.generateUid()
        insert(currentLink.id)
    }
    // Update normal data
    const link = editorNode.querySelector(`a#${currentLink.id}`)
    link.href = userForm.querySelector('#href').value
    link.innerText = userForm.querySelector('#label').value
    // Add event handler
    format(link)
    // Close the edit pane
    editPane.querySelector('button.btn-close').click()
} 

const click = function(range){
    console.log('link: clicked custom button with range',range)
    savedRange = range
    let firstTime = false
    if ( currentLink == false ){
        firstTime = true
        let label = ''
        if ( range.collapsed == false && 
             range.startContainer == range.endContainer ){
             label = range.endContainer.textContent.substring(range.startOffset, range.endOffset)  
        }
        currentLink = {
            id:'',
            href:'', 
            label, 
        }
        editPane.querySelector('.title').innerText = 'Create link'
    } else {
        editPane.querySelector('.title').innerText = 'Edit link'
    }
    editPane.querySelector('.body').innerHTML = form()
    editPane.querySelector('#href').value = currentLink.href
    editPane.querySelector('#label').value = currentLink.label
    // Flag dirty data
    modal.reset()
    const inputs = editPane.querySelectorAll('form input, form textarea, form select')
    inputs.forEach(input => input.addEventListener('change', modal.markDirty))
    // Handle button events
    editPane.querySelector('button.cancel').addEventListener('click', ()=>modal.show(
        'Cancel changes', 'Do you really want to lose these changes?', cancelChanges))
    if ( firstTime ){
        editPane.querySelector('button.delete').style.display = 'none'
    } else {
        editPane.querySelector('button.delete').style.display = 'inline-block'
        editPane.querySelector('button.delete').addEventListener('click', ()=>modal.show(
            'Delete agreement', 'Do you really want to delete this agreement?', deleteItem, true))
    }
    editPane.querySelector('button.save').addEventListener('click', saveChanges)
    // Display the populated offcanvas pane
    bsOffcanvas.show()
}

const getNewNode = function(node){
    let matched = false
    while ( !matched  ){
        if ( node.tagName === 'A' ){
            matched = node
        }
        node = node.parentNode
    }
    return matched
}

function getLinkObject(node){
    return {
        id: node.id,
        href: node.href,
        label: node.innerText.trim(),
    }
}

const editClickedObject = function(event){
    event.preventDefault()
    const link = getNewNode(event.currentTarget)
    console.log('edit link', link )
    currentLink = getLinkObject( link )
    click()
}

const cancelChanges = function(){
    editPane.querySelector('button.btn-close').click()
}

const deleteItem = function(){
    editPane.querySelector('button.btn-close').click()
}

const clean = function(node){
    console.log('clean link',node)
    node.removeAttribute('id')
    node.removeAttribute('contenteditable')
    return node
}

const format = function( link ){
    // Click event handling - first time and after reformatting
    link.id = Utils.generateUid()
    link.setAttribute('contenteditable',false)
    link.addEventListener('click', editClickedObject )
}

const addEventHandlers = function( editor ){
    const links = editor.querySelectorAll('a')
    links.forEach(link => link.addEventListener('click', editClickedObject))
}

const setup = function(target, firstTime ){
    console.log('Setup links')
    editorNode = target
    currentLink = false
    savedRange = false
    let links = target.querySelectorAll( 'a' )
    links.forEach( link => {
        format( link )
    })
}

const form = function(){
    return `
        <form>
            <div class="form-floating mb-3">
                <input id="href" type="text" class="form-control" placeholder="URL" value="">
                <label for="href">URL</label>
            </div>
            <div class="form-floating mb-3">
                <input id="label" type="text" class="form-control" placeholder="Label" value="">
                <label for="label">Label (optional)</label>
            </div>
        </form>`
}

export const init = async function(){
    console.log('init links')
    editPane = Navigator.getOffcanvas()
    modal = new CustomConfirm( editPane )
    bsOffcanvas = new bootstrap.Offcanvas( editPane )
}



export const button = {
    type:'custom', 
    id:'b-link', 
    tag:'a',
    label:'Link', 
    icon:Icons.link,
    // Interface methods:
    click,
    setup,
    addEventHandlers,
    clean
}