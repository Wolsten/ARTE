import ToolbarButton from '../ToolbarButton.js'
import * as Icons from '../icons.js'
import {setCursor} from '../helpers.js'
import * as ModalPopup from '../modalPopup.js'

const VISIBLE_ITEMS = 5
let editor
let people = []
let listElement
let filterText = ''
let inputElement
let selectedIndex = 0
let panel = null


function filterList(){
    let html = ''
    let n = 0
    people.forEach( (person, index) => {
        const p = person.toLowerCase()
        let classes = ''
        if ( n == selectedIndex ){
            classes += ' selected'
        }
        const filtered = filterText != '' ? p.includes(filterText) : true
        if ( n < VISIBLE_ITEMS && filtered ){
            n ++
            classes += ' show'
        }
        html += `<li class="${classes}">${person}</li>`
    })
    return html
}



/**
 * Generate the html for the input form
 * @returns {string} HTML form string
 */
function form(){
    const html = filterList()
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
    const visible = listElement.querySelectorAll('li.show')
    if ( visible.length == 0 ){
        selectedIndex = -1
    // Move down list
    } else if ( key=='ArrowDown' || key=='ArrowRight' || (key=='Tab' && shiftKey==false)){
        event.preventDefault()
        if ( selectedIndex < visible.length - 1  ){
            selectedIndex ++
        } else {
            selectedIndex = 0
        }
    // Move up list
    } else if ( key=='ArrowUp' || key=='ArrowLeft' || (key=='Tab' && shiftKey) ){
        event.preventDefault()
        if ( selectedIndex == 0 ){
            selectedIndex = visible.length - 1
        } else {
            selectedIndex --
        }
    // Filter list if not pressed enter
    } else if ( key!='Enter' ){
        filterText = inputElement.value.toLowerCase()
        const html = filterList()
        listElement.innerHTML = html
        selectedIndex = html == '' ? -1 : 0
    }
    // Enter pressed?
    if ( key == 'Enter' ){
        event.preventDefault()
        const chosen = selectedIndex!= -1 ? visible[selectedIndex].textContent : inputElement.value
        insert(chosen)
    } else if ( selectedIndex != -1 ){
        visible.forEach( (item,index) => {
            if ( item.classList.contains('selected') ){
                item.classList.remove('selected')
            } else if ( index == selectedIndex ){
                item.classList.add('selected')
            }
        })
    }
}


/**
 * Handle mentions button click
 * @param {object} edt The editor instance
 * @param {object} btn The button clicked
 */
function click(edt,btn){
    if ( edt.range === false ){
        console.log('No range selected')
        return
    }
    editor = edt
    selectedIndex = 0
    const html = form()
    panel = ModalPopup.show(editor,html)
    inputElement = panel.querySelector('input')
    inputElement.value = ''
    filterText = ''
    listElement = panel.querySelector('ul')
    panel.addEventListener('keyup', handleKeyUp)
    inputElement.focus()
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
        after = after.slice(1, after.length-1)
    }
    // Add space before?
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
    editor.range.startContainer.textContent = before + person + after
    // Move offset to the end of the newly inserted person
    offset += person.length
    editor.range = setCursor( editor.range.startContainer, offset )
    ModalPopup.hide()
    // Update the buffer explicity because this operation does not
    // change the dom tree and hence will be missed by the observer
    editor.bufferUpdate(editor)
}


/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
 const setState = function( editor, button ){
    if ( editor.range === false  || 
        (editor.range.collapsed==false && editor.range.startContainer != editor.range.endContainer) ){
        button.element.disabled = true
        button.element.classList.remove('active')
    } else {
        button.element.disabled = false
        button.element.classList.add('active')
    }
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const setup = function(peeps){
    people = peeps.sort()
}

const options = {setState, shortcut:['@','Tab']}
export const BUTTON = new ToolbarButton( 'custom', 'mention', 'Mention', Icons.person, click, options ) 