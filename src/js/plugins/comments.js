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
const TAG = 'COMMENT'

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
 * Edit an existing comment node by extracting the data from the node and displaying
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
            title:'Cancel changes', 
            html:'Do you really want to lose these changes?',
            buttons: {
                cancel: { label:'No - keep editing'},
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
        title:'Delete changes', 
        html:'Do you really want to delete this item?',
        buttons: {
            cancel: { label:'No - keep editing'},
            confirm: { label:'Yes - delete comment', callback:handleConfirmDelete }
        }
    })
    confirm.show()
}

/**
 * Show the custom dialogue.
 * @param {boolean} editFlag Whether editing existing custom element or creating new
 */
function show( editFlag ){
    let title = 'Add comment'
    let buttons = {
        cancel:  { label:'Cancel', callback:handleCancel },
        confirm: { label:'Save', callback:save }
    }
    if ( editFlag ){
        title = 'Edit comment'
        buttons.delete = { label:'Delete', callback:handleDelete }
    } else {
        node = document.createElement(TAG)
        node.id = Helpers.generateUid()
        node.setAttribute('contenteditable','false')
        node.dataset.comment = ' '
    }
    // Create and display the modal panel
    drawer = new Modal({
        type:'drawer',
        title,
        html: form(node.dataset.comment), 
        buttons
    })
    drawer.show()
    // Initialise confirmation module and dirty data detection
    dirty = false
    const input = drawer.panel.querySelector('form textarea')
    input.addEventListener('change', () => dirty=true)
    // Focus the first property
    const comment = drawer.panel.querySelector('form textarea#comment')
    comment.focus()
    comment.setSelectionRange(comment.value.length, comment.value.length)
}

/**
 * Save the new or edited custom element
 */
function save(){
    // console.log('Save changes')
    node.dataset.comment = drawer.panel.querySelector('form #comment').value.trim()
    if ( node.parentNode == null ){
        insert()
    }
    drawer.hide()
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
    element.innerHTML = ''
    element.setAttribute('contenteditable',false)
    // Add edit button and listener
    const editButton = document.createElement('button')
    editButton.type = 'button'
    editButton.classList.add('edit')
    editButton.innerHTML = Icons.commentEdit
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
 * @param {string} comment The comment to be edited
 * @returns {string} Generated html
 */
function form(comment){
    return `
        <form>
            <div class="form-input">
                <label for="comment">Comment</label>
                <textarea id="comment" class="form-control" placeholder="Enter your comment" required>${comment}</textarea>
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
    const comments = edt.editorNode.querySelectorAll( btn.tag )
    comments.forEach( element => format( element ) )
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
    if ( drawer && drawer.active() ){
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
export const BUTTON = new ToolbarButton( 'custom', TAG, 'Custom', Icons.comment, click, options ) 