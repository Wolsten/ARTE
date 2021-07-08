"use strict"

import * as Utils from '../../js/utils.js'
import * as Icons from '../../js/icons.js'

let people = []
let position = {x:0, y:0}
let filterInput
let panel
let range

const getPosition = function(dialogue, range){
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
        console.log('text node position',pos)
    }
    if ( (pos.x + dialogue.outerWidth) > window.innerWidth ){
        pos.x = window.innerWidth - dialogue.outerWidth - 20;
    }
    if ( (pos.y + dialogue.outerHeight) > window.innerHeight ){
        pos.y = window.innerHeight - dialogue.outerHeight - 40;
    }
    return pos
} 

const form = function(){
    return `
        <div class="mentions-content">
            <input list="people-list" type="text"/>
            <datalist id="people-list"></datalist>
        </div>`
}

function handleKeyup(event){
    console.log('key',event.target)
    console.log('key',event.key)
    console.log('shift',event.shiftKey)
    event.stopPropagation()
    if ( event.key=='Escape' ){
        panel.remove()
    } else if ( event.key=='Enter' ){
        insert(filterInput.value.trim())
        panel.remove()
    }
}

const click = function(lastRange){
    range = lastRange
    console.log('click mentions')
    if ( range === false ){
        console.log('No range selected')
        return
    }
    panel = document.createElement('DIV')
    panel.id = 'mentions'
    panel.classList.add('mentions-panel')
    panel.innerHTML = form()
    panel.addEventListener('click',hide)
    panel.addEventListener('keyup', handleKeyup)
    // Filtering using native html approach
    filterInput = panel.querySelector('input')
    const datalist = panel.querySelector('datalist')
    people.forEach( item => {
        const option = document.createElement('option')
        option.innerText = item
        datalist.appendChild(option)
    })
    // Add to dom, position and focus the input
    document.querySelector('body').appendChild(panel)
    // Positioning
    let dialogue = document.querySelector('.mentions-content')
    position = getPosition(dialogue, range)
    dialogue.style.top = `${position.y}px`
    dialogue.style.left = `${position.x}px`
    // Focus
    filterInput.focus()
}


const hide = function(){
    console.log('Hide panel')
    panel.remove()
}

const insert = function(event_or_person){
    let person
    if ( event_or_person.target != undefined ){
    if ( "target" in event_or_person )
        person = event_or_person.target.innerText
    } else {
        person = event_or_person
    }
    console.log('Insert person', person)
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
    range = Utils.setCursor( range.startContainer, offset )
    panel.remove()
}

const init = function(peopleList){
    console.log('init mentions', peopleList)
    people = peopleList
}


// Buttons have a mandatory method "click" and two optional 
// methids "setup" and "clean". In this case only click is required
const button = {
    type:'custom', 
    id:'b-mention', 
    tag:'mention',
    label:'Mention', 
    icon:Icons.person,
    shortcut:'@',
    attr:'',
    // Interface methods:
    click,
}

export {
    init,
    button,
}