import ToolbarButton from '../ToolbarButton.js'
import * as Icons from '../icons.js'
import {setCursor} from '../helpers.js'
import Modal from '../Modal.js'

let editor
let people = []
let listItemElements
let listContainerElement
let inputElement
let selectedIndex = 0
let modal = null // This will be an instance of the Modal class

/**
 * Generate the list elements for the full list of people
 * setting the initial ones to be visible (with the "show" class) and the first
 * one to be selected (using the "selected" class)
 * @param {string} filterText The text input string
 * @returns {string} list of li's 
 */
function filterList(filterText){
    let html = ''
    people.forEach( person => {
        const p = person.toLowerCase()
        const filtered = filterText != '' ? p.includes(filterText) : true
        if ( filtered ){
            html += `<li>${person}</li>`
        }
        
    })
    return html
}


/**
 * Highlight the selected item as a result of navigating through the list
 * @param {boolean} scroll Whether to scroll the selected item into view
 */
function highlightItem(scroll=true){
    if ( selectedIndex >= 0 && listItemElements.length > 0 ){
        listItemElements.forEach( item => item.classList.remove('selected') )
        listItemElements[selectedIndex].classList.add('selected')
        if ( scroll ){
            listItemElements[selectedIndex].scrollIntoView({block: "end", inline: "nearest"})
        }
    }
}

/**
 * Generate the html for the input form
 * @returns {string} HTML form string
 */
function form(){
    const html = filterList('')
    return `<div class="mentions">
                <input type="text"/>
                <ul>${html}</ul>
            </div>`
}

/**
 * Handle key down events anywhere in the panel
 * @param {Event} event The keydown event
 */
function handleKeyUp( event ){
    const key = event.key
    const shiftKey = event.shiftKey
    let navigated = false

    event.preventDefault()
    event.stopPropagation()

    if ( listItemElements.length == 0 ){
        selectedIndex = -1
    // Move down list
    } else if ( key=='ArrowDown' || key=='ArrowRight' || (key=='Tab' && shiftKey==false)){
        event.preventDefault()
        if ( selectedIndex < listItemElements.length - 1  ){
            selectedIndex ++
        } else {
            selectedIndex = 0
        }
        navigated = true
        highlightItem()
    // Move up list
    } else if ( key=='ArrowUp' || key=='ArrowLeft' || (key=='Tab' && shiftKey) ){
        event.preventDefault()
        if ( selectedIndex == 0 ){
            selectedIndex = listItemElements.length - 1
        } else {
            selectedIndex --
        }
        navigated = true
        highlightItem()
    } 
    // Not navigated - therefore check if pressed enter or not
    if ( navigated == false ) {
        // Filter list if not pressed enter
        if ( key!='Enter' ){
            // console.log('filter',inputElement.value.toLowerCase())
            listContainerElement.innerHTML = filterList( inputElement.value.toLowerCase() )
            listItemElements = listContainerElement.querySelectorAll('li')
            selectedIndex = 0
            highlightItem()
        // Enter pressed?
        } else {
            // If have any visible list items then chose the one selected, otherwise
            // just enter the current input value
            const chosen = selectedIndex!= -1 ? listItemElements[selectedIndex].textContent : inputElement.value
            insert(chosen)
        }
    }
}

/**
 * Handle clicking on a list item and insert the clicked value
 * @param {Event} event 
 */
function handleListClick(event){
    insert(event.target.textContent)
}

/**
 * Insert a new person's name in the appropritae position
 * @param {string} person 
 */
function insert(person){
    let contents = editor.range.startContainer.textContent
    let offset   = editor.range.startOffset
    let before   = contents.substring(0,offset)
    let after    = contents.substring(offset)
    // Remove optional @
    if ( after.charAt(0) === '@' ){
        after = after.slice(1, after.length)
    }
    // Add space before?
    if ( person != '' ){
        if ( contents.charCodeAt(offset-1) !== 32){
            person = ' ' + person
        }
        // Add space after
        if ( offset<contents.length && contents.charCodeAt(offset) !== 32){
            if ( after != ''){
                after = after + ' '
            }
            person = person + ' '
        }
    }
    editor.range.startContainer.textContent = before + person + after
    // Move offset to the end of the newly inserted person
    offset += person.length
    editor.range = setCursor( editor.range.startContainer, offset )
    // Hide the modal
    modal.hide()
    editor.buffer()
}

const escape = function(){
    insert('')
}

/**
 * Handle mentions button click
 * @param {object} edt The editor instance
 * @param {object} btn The button clicked
 */
 function click(edt,btn){
    if ( edt.range === false ){
        // console.log('No range selected')
        return
    }
    editor = edt
    // Create the modal, show and position
    modal = new Modal({
        type:'positioned',
        escape,
        html:form()
    })
    modal.show()
    modal.setPosition(editor.range, editor.editorNode)
    // Add custom event handling - add keyup to main container
    // so can detect/filter keystrokes and handle navigation in the
    // list using arrow keys and tabs
    modal.container.addEventListener('keyup', handleKeyUp)
    listContainerElement = modal.container.querySelector('ul')
    listContainerElement.addEventListener('click', handleListClick)
    // Init list items and selection
    listItemElements = listContainerElement.querySelectorAll('li')
    selectedIndex = 0
    highlightItem(false)
    // Initialise the text input
    inputElement = modal.container.querySelector('input')
    inputElement.value = ''
    inputElement.focus()
}

/**
 * Set the disabled state of this button. This one can never be active
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
 const setState = function( editor, button ){
    button.element.disabled = 
        editor.range.collapsed==false || 
        editor.range.custom !== false
}


// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const setup = function(peeps){
    people = peeps.sort()
}

const options = {setState, shortcut:['@','@']}
export const BUTTON = new ToolbarButton( 'custom', 'MENTION', 'Mention', Icons.person, click, options ) 