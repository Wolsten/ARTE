"use strict"

class Mentions {

    constructor(icon, people){
        this.people = people
        this.position = {x:0, y:0}
        this.filterInput = ''
        this.panel = null
        // Buttons have a mandatory method "click" and two optional 
        // methods "setup" and "clean". In this case only click is required
        this.button = {
            // Mandatory attributes
            type:'custom', 
            id:'b-mention', 
            tag:'mention',
            label:'Mention', 
            icon:icon,
            click:this.click,
            that:this,
            // Optional attributes
            shortcut:'@',
            attr:'',
        }
    }

    getPosition(dialogue, range){
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

    form(){
        return `
            <div class="mentions-content">
                <input list="people-list" type="text"/>
                <datalist id="people-list"></datalist>
            </div>`
    }

    handleKeyup(e){
        console.log('key',e.target)
        console.log('key',e.key)
        console.log('shift',e.shiftKey)
        e.stopPropagation()
        if ( e.key=='Escape' ){
            this.panel.remove()
        } else if ( e.key=='Enter' ){
            this.insert(this.filterInput.value.trim())
            this.panel.remove()
        }
    }

    click(range){
        console.log('click mentions')
        if ( range === false ){
            console.log('No range selected')
            return
        }
        const _this = this.that
        _this.range = range
        _this.panel = document.createElement('DIV')
        _this.panel.id = 'mentions'
        _this.panel.classList.add('mentions-panel')
        _this.panel.innerHTML = _this.form()
        _this.panel.addEventListener('click',()=>_this.hide())
        _this.panel.addEventListener('keyup', e=>_this.handleKeyup(e))
        // Filtering using native html approach
        _this.filterInput = _this.panel.querySelector('input')
        const datalist = _this.panel.querySelector('datalist')
        people.forEach( item => {
            const option = document.createElement('option')
            option.innerText = item
            datalist.appendChild(option)
        })
        // Add to dom, position and focus the input
        document.querySelector('body').appendChild(_this.panel)
        // Positioning
        let dialogue = document.querySelector('.mentions-content')
        _this.position = _this.getPosition(dialogue, range)
        dialogue.style.top = `${_this.position.y}px`
        dialogue.style.left = `${_this.position.x}px`
        // Focus
        _this.filterInput.focus()
    }

    hide(){
        console.log('Hide panel')
        this.panel.remove()
    }

    insert(event_or_person){
        let person
        if ( event_or_person.target != undefined ){
        if ( "target" in event_or_person )
            person = event_or_person.target.innerText
        } else {
            person = event_or_person
        }
        console.log('Insert person', person)
        let contents = this.range.startContainer.textContent
        let offset   = this.range.startOffset
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
        this.range.startContainer.textContent = before + person + after
        // Move offset to the end of the newly inserted person
        offset += person.length
        this.range = this.setCursor( this.range.startContainer, offset )
        this.panel.remove()
    }

    setCursor( node, offset ){
        let range = document.createRange()
        let sel = window.getSelection()
        range.setStart(node, offset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return range;
    }
}

export default Mentions