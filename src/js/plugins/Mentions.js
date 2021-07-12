"use strict"

import ToolbarButton from './ToolbarButton.js'
import * as Icons from './icons.js'

let dataListOptions = ''
let range
let panel = null
let filterInput = ''

function getPosition(dialogue, range){
    let pos
    // If this is not a text node then get the first text node
    // Can happen at the start of a line when backspace to the start
    if ( range.startContainer.nodeType !== 3 ){
        if ( range.startContainer.childNodes.length>0 ){
            let node = range.startContainer.childNodes[0]
            pos = node.getBoundingClientRect()
        } else {
            pos = {x:editor.offsetLeft, y:editor.offsetTop}
        }
    // Text node
    } else {
        pos = range.getBoundingClientRect()
        console.log('text node const ',pos)
    }
    if ( (pos.x + dialogue.outerWidth) > window.innerWidth ){
        pos.x = window.innerWidth - dialogue.outerWidth - 20;
    }
    if ( (pos.y + dialogue.outerHeight) > window.innerHeight ){
        pos.y = window.innerHeight - dialogue.outerHeight - 40;
    }
    return pos
} 


function form(){
    return `
        <div class="mentions-content">
            <input list="people-list" type="text"/>
            <datalist id="people-list">${dataListOptions}</datalist>
        </div>`
}

function handleKeyup(e){
    console.log('key',e.target)
    console.log('key',e.key)
    console.log('shift',e.shiftKey)
    e.stopPropagation()
    if ( e.key=='Escape' ){
        hide()
    } else if ( e.key=='Enter' ){
        insert(filterInput.value.trim())
    }
}

function click(rng){
    if ( rng === false ){
        console.log('No range selected')
        return
    }
    range = rng
    panel = document.createElement('DIV')
    panel.id = 'mentions'
    panel.classList.add('mentions-panel')
    panel.innerHTML = form()
    panel.addEventListener('click',()=>hide())
    panel.addEventListener('keyup', e=>handleKeyup(e))
    // Filtering using native html approach
    filterInput = panel.querySelector('input')
    // Add to dom
    document.querySelector('body').appendChild(panel)
    // Position
    let dialogue = document.querySelector('.mentions-content')
    const position = getPosition(dialogue, range)
    dialogue.style.top = `${position.y}px`
    dialogue.style.left = `${position.x}px`
    // Focus the input
    filterInput.focus()
}

function hide(){
    panel.remove()
    panel = null
}

function insert(person){
    let contents = range.startContainer.textContent
    let offset   = range.startOffset
    let before   = contents.substring(0,offset)
    let after    = contents.substring(offset)
    // Add space before?
    if ( contents.charCodeAt(offset-1) !== 32){
        person = ' ' + person
    }
    // Add space after & optional remove @
    if ( offset<contents.length && contents.charCodeAt(offset) !== 32){
        if ( after != '' && after.charAt(0) === '@'){
            after = after.slice(1, after.length-1)
        }
        person = person + ' '
    }
    range.startContainer.textContent = before + person + after
    // Move offset to the end of the newly inserted person
    offset += person.length
    range = setCursor( range.startContainer, offset )
    hide()
}

function setCursor( node, offset ){
    let rng = document.createRange()
    let sel = window.getSelection()
    rng.setStart(node, offset);
    rng.collapse(true);
    sel.removeAllRanges();
    sel.addRange(rng);
    return rng;
}



// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------


export const initPeople = function(people){
    people = people.sort()
    dataListOptions = ''
    people.forEach( person => {
        dataListOptions += `<option>${person}</option>`
    })
}

const options = {shortcut:'@'}
const button = new ToolbarButton( 'custom', 'mention', 'Mention', Icons.person, click, options ) 
export const buttons = [button]