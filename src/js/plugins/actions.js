/** 
 * 
 * File format (optional due date):
 * <arte-action id="id" data-status="0" data-todo="todo" data-owners="owners" data-due="due" data-created="date" data-updated="date" data-notes="Some notes">
 * </arte-action>
 * 
 * Editor format (optional due date):
 * <arte-action id="id" data-status="0" data-todo="todo" data-owners="owners" data-due="due" data-created="date" data-updated="date" data-notes="notes" contenteditable="false" >
 *      <label class="status-class"><i>icon</i></label>
 *      <button type="button" title="Click to edit action">
 *          <span class="todo">todo</span>
 *          <label>Owners:</label>
 *          <span class="owners">owners</span>
 *          [<label>Due:</label>
 *          <span class="due">date</span>]
 *      </button>
 * </arte-action>
 * 
 * Sidebar format (optional due date):
 * <article class="action">
 *      <a href="#id">todo</a>
 *      <p>Owned by: owners}[,<br/>Due: date]</p>
 * </article>`
 */

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
const TAG = 'ARTE-ACTION'

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
let drawer = null

 /**
  * @var {HTMLElement} confirm The container for the modal confirm dialogue
  */
let confirm = null


// -----------------------------------------------------------------------------
// @section Private methods
// -----------------------------------------------------------------------------

/**
 * Edit an existing action node by extracting the data from the node and displaying
 * the edit form
 * 
 * @param {HTMLElement} element The comment node to be edited
 */
function edit( element ){
    // If we already have an active panel - ignore edit clicks
    if ( drawer && drawer.active() ){
        return
    }
    node = element
    show(true)
}

function handleConfirmCancel(){
    confirm.hide()
    drawer.hide()
}

function handleConfirmDelete(){
    confirm.hide()
    drawer.hide()
    deleteItem() 
}

function handleCancel(){
    if ( dirty ){
        confirm = new Modal({ 
            type:'overlay',
            severity:'warning',
            title:'Cancel changes?', 
            html:'Do you really want to lose these changes?',
            buttons: {
                cancel: { label:'No'},
                confirm: { label:'Yes - lose changes', callback:handleConfirmCancel}
            }
        })
        confirm.show()
    } else {
        drawer.hide()
    }
}

function handleDelete(){
    confirm = new Modal({ 
        type:'overlay',
        severity:'danger',
        title:'Delete action?', 
        html:'Do you really want to delete this action?',
        buttons: {
            cancel: { label:'No'},
            confirm: { label:'Yes - delete', callback:handleConfirmDelete }
        }
    })
    confirm.show()
}


/**
 * Show the custom dialogue.
 * @param {boolean} editFlag Whether editing existing custom element or creating new
 */
function show( editFlag ){
    let title = 'Add action'
    let buttons = {
        cancel:  { label:'Cancel', callback:handleCancel },
        confirm: { label:'Save', callback:save }
    }
    if ( editFlag ){
        title = 'Edit action'
        buttons.delete = { label:'Delete', callback:handleDelete }
    } else {
        // Create an action as saved to file
        node = document.createElement(TAG)
        node.id = Helpers.generateUid()
        node.setAttribute('contenteditable','false')
        node.dataset.status = '0'
        node.dataset.todo = ''
        node.dataset.owners = ''
        node.dataset.due = ''
        node.dataset.created = ''
        node.dataset.updated = ''
        node.dataset.notes = ''
    }
    // Create and display the modal panel
    drawer = new Modal({
        type:'drawer',
        title,
        html: form(), 
        buttons
    })
    drawer.show()
    // Initialise confirmation module and dirty data detection
    dirty = false
    const inputs = drawer.panel.querySelectorAll('form input, form textarea, form select')
    inputs.forEach(input => input.addEventListener('change', () => dirty=true))
    // Focus the todo
    const todo = drawer.panel.querySelector('#todo')
    todo.focus()
    todo.setSelectionRange(todo.value.length, todo.value.length)
}

/**
 * Save the new or edited custom element
 */
function save(){
    // console.log('Save changes')
    node.dataset.todo = drawer.panel.querySelector('#todo').value.trim()
    node.dataset.owners = drawer.panel.querySelector('#owners').value.trim()
    node.dataset.due = drawer.panel.querySelector('#due').value.trim()
    node.dataset.status = parseInt(drawer.panel.querySelector('#status').value.trim())
    node.dataset.notes = drawer.panel.querySelector('#notes').value.trim()
    const timestamp = new Date()
    const localstring = timestamp.toLocaleString().slice(0,-3)
    //console.log('local timestamp', localstring)
    if ( node.dataset.created == '' ){
        node.dataset.created = localstring
        insert()
    }
    node.dataset.updated = localstring
    drawer.hide()
    // Format node and add event handler
    format(node)
    // Update state
    editor.range = Helpers.setCursor( node, 0)
    setState(editor, button)
    editor.buffer()
} 

/**
 * Insert a new action in the editor at the end of the current 
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
    editor.buffer()
}

/**
 * Optional method to reformat/clean the custom element as it should be saved in a file or database
 * @param {HTMLElement} node
 * @returns HTMLElement as cleaned
 */
function clean(node){
    // console.log('clean custom element',node)
    node.removeAttribute('contenteditable')
    node.innerHTML = ''
    return node
}

/**
 * Format the given action and add click event handler
 * 
 * @param {HTMLElement} element
 */
function format( element ){
    const id = element.id
    // Generate new id if required
    if ( element.id == false ){
        element.id = Helpers.generateUid()
    }
    element.setAttribute('contenteditable',false)
    element.innerHTML = template(element)
    // Add event listener
    element.querySelector('button').addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        edit(element) 
    })
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
 * Return the status class for the current action status
 * @param {string} status 
 * @returns {string}
 */
function getStatusClass(status){
    switch ( parseInt(status) ){
        case 0: return 'status-open'
        case 1: return 'status-closed-incomplete'
        case 2: return 'status-closed-complete'
    }
    return 'status-unknown'
}

/**
 * Create a template for how the action is presented in the editor
 * @param {string,string,string} action The properties to display
 * @returns {string} HTML text to display
 */
function template(action){
    const statusClass = getStatusClass(action.dataset.status)
    const due = action.dataset.due == '' ? '' : `
        <label>Due:</label>
        <span class="due">${action.dataset.due}</span>`
    return `
        <button type="button" title="Edit this action">
            <label class="${statusClass}">${Icons.action}</label>
            <span class="todo">${action.dataset.todo}</span>
            <label>Owners:</label>
            <span class="owners">${action.dataset.owners}</span>
            ${due}
        </button>`
}

/**
 * Form template
 * @returns {string} Generated html
 */
function form(){
    const todo = node.querySelector('.todo').innerHTML.trim()
    const owners = node.querySelector('.owners').innerHTML.trim()
    const optional = node.querySelector('.due')
    let due
    if ( optional == null ){
        due = ''
    } else {
        due = optional.innerHTML.trim()
    }
    return `
        <form class="comment">
            <div class="form-input">
                <label for="todo">What needs to be done</label>
                <textarea id="todo" class="form-control" required>${todo}</textarea>
            </div>
            <div class="form-input">
                <label for="owners">Owners</label>
                <input type="text" id="owners" class="form-control" value="${owners}" required />
            </div>
            <div class="form-input">
                <label for="due">Due by</label>
                <input type="text" id="due" class="form-control" value="${due}"/>
            </div>
            <div class="form-input">
                <label for="status">Status</label>
                <select id="status" class="form-control">
                    <option value="0" ${node.dataset.status==0 ? 'selected' : ''}>Open</option>
                    <option value="1" ${node.dataset.status==1 ? 'selected' : ''}>Closed - Incomplete</option>
                    <option value="2" ${node.dataset.status==2 ? 'selected' : ''}>Closed - Complete</option>
                </select>
            </div>
            <div class="form-input">
                <label for="notes">Notes</label>
                <textarea id="notes" class="form-control">${node.dataset.notes}</textarea>
            </div>
        </form>`
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
    const actions = edt.editorNode.querySelectorAll( btn.tag )
    actions.forEach( element => format( element ) )
}

/**
 * Set the disabled and active states of a button
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to act on
 */
const setState = function( edt, btn ){
    //console.warn('custom setState edt.range',edt.range)
    if ( edt.range===false || 
         edt.range.rootNode == edt.editorNode || 
         Helpers.isBlock(edt.range.rootNode) == false ){
        //console.log('Disabling button')
        btn.element.disabled = true
        btn.element.classList.remove('active')
    } else {
        //console.log('Enabling button')
        btn.element.disabled = false
        const action = edt.range.blockParent.querySelector(TAG)
        if ( action != null ){
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
    if ( drawer && drawer.active() ){
        return
    }
    editor = edt
    button = btn
    const action = editor.range.blockParent.querySelector(TAG)
    if ( action != null ){
        edit(action)
    } else {
        show(false)
    }
}

/**
 * Display custom html in the sidebar
 * @param {Object} edt 
 * @returns {Object} {icon,label,content}
 */
const sidebar = function(edt){
    const actions = edt.editorNode.querySelectorAll(TAG)
    let content = ''
    actions.forEach( action => {
        const todo = action.querySelector('.todo').innerHTML.trim()
        const owners = action.querySelector('.owners').innerHTML.trim()
        const due = action.querySelector('.due')
        let html = ''
        if ( due != null ){
            html += `,<br/>Due: ${due.innerText.trim()}`
        }
        content += `
            <article class="action">
                <a href="#${action.id}">${todo}</a>
                <p>Owned by: ${owners}${html}</p>
            </article>`
    })
    return {
        icon: Icons.action,
        label: 'actions',
        content: `${content}`
    }
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const options = {setState, init, addEventHandlers, clean, sidebar}
export const BUTTON = new ToolbarButton( 'custom', TAG, 'Action', Icons.action, click, options ) 