import * as Icons from './icons.js'
import * as Helpers from './helpers.js'

const BUTTON_ORDER = ['cancel','delete','confirm']

class Modal {

    constructor( options ){
        // Defaults
        this.type = 'overlay'
        this.panel = null       // The HTMLElement representing the modal panel
        this.container = null   // The HTMLElement representing the innerHTML of the modal
        this.title  = ''
        this.html = ''
        this.severity = ''
        this.buttons = false
        this.escape = false
        // Override defaults with any options supplied
        for( let option in options ){
            this[option] = options[option]
        }
    }

    /**
     * Set the position for the input dialogue based on current range
     * @param {Range} range - The current editor selection
     * @param {HTMLElement} editorNode - The editor node
     */
    setPosition( range, editorNode ){
        this.container = this.panel.querySelector('.modal-panel-container')
        let pos
        // If this is not a text node then get the first text node
        // Can happen at the start of a line when backspace to the start
        if ( range.startContainer.nodeType !== 3 ){
            if ( range.startContainer.childNodes.length>0 ){
                let node = range.startContainer.childNodes[0]
                pos = node.getBoundingClientRect()
            } else {
                pos = {x:editorNode.offsetLeft, y:editorNode.offsetTop}
            }
        // Text node
        } else {
            pos = range.getBoundingClientRect()
            //console.log('text node const ',pos)
        }
        if ( (pos.x + this.container.outerWidth) > window.innerWidth ){
            pos.x = window.innerWidth - this.container.outerWidth - 20;
        }
        if ( (pos.y + this.container.outerHeight) > window.innerHeight ){
            pos.y = window.innerHeight - this.container.outerHeight - 40;
        }
        this.container.style.top = `${pos.y}px`
        this.container.style.left = `${pos.x}px`
    } 

    /**
     * Generate the innerHTML for the modal panel
     * @returns {string}
     */
    template(){
        let styles = []
        if ( this.backgroundColour != undefined ){
            styles.push( `background-color:${this.backgroundColour}`)
        }
        if ( this.borderRadius != undefined ){
            styles.push( `border-radius:${this.borderRadius}`)
        }
        const style = styles.length == 0 ? '' : `style="${styles.join(';')}"`
        let html = `<div class="modal-panel-container" ${style}>`
        let icon = ''
        switch(this.severity){
            case 'info':
                icon = Icons.info
                break
            case 'warning':
                icon = Icons.warning
                break
            case 'danger':
                icon = Icons.danger
                break
        }
        if ( this.title || icon ){
            const withText = this.title ? 'with-text' : ''
            html += `
                <header class="modal-panel-header">
                    <h3 class="modal-panel-title ${withText}">${icon}${this.title}</h3>
                </header>`
        }
        if ( this.html ){
            html += `<div class="modal-panel-body">${this.html}</div>`
        }
        if ( this.buttons ){
            let buttonHTML = ''
            let buttonCount = 0
            BUTTON_ORDER.forEach( type => {
                if ( this.buttons[type] ){
                    buttonCount ++
                    buttonHTML += `<button type="button" class="${type}">${this.buttons[type].label}</button>`
                }
            })
            const centred = buttonCount == 1 ? 'centred' : ''
            html += `<div class="modal-panel-buttons ${centred}">${buttonHTML}</div>`
        }
        html += `</div>`
        return html
    }

    /**
     * Hide current panel by removing transition class "show" and then removing from
     * the dom.
     */
    hide(){
        this.panel.classList.remove('show')
        setTimeout( ()=>{
            this.panel.remove()
            this.panel = null
        }, 500 )
    }

    /**
     * Return true if a modal panel is already displayed
     * @returns {boolean}
     */
    active(){
        if ( document.querySelector(`.modal-panel`) ){
            return true
        }
        return false
    }

    /**
     * Add event listeners to the optional buttons with classes: 'cancel|delete|confirm'
     * Also optionally check for Escape key to close the modal
     */
    addEventListeners(){
        // Button callbacks
        if ( this.buttons ){
            BUTTON_ORDER.forEach( type => {
                if ( this.buttons[type] ){
                    const button = this.buttons[type]
                    const element = this.panel.querySelector(`button.${type}`)
                    if ( element ){
                        element.addEventListener('click', ()=> {
                            if ( button.callback ){
                                button.callback()
                            } else {
                                this.hide()
                            }
                        })
                    }
                }
            })
        }
        // Support escape key and background clicks?
        if ( this.escape ){
            document.addEventListener('keydown', event => {
                if ( event.key == 'Escape' ){
                    event.stopPropagation()
                    // Invoke cancel callback if available
                    if ( this.escape  instanceof Function ){
                        this.escape()
                    } else {
                        this.hide()
                    }
                }
            })
            this.panel.addEventListener( 'click', event => {
                if ( event.target == this.panel ){
                    event.stopPropagation()
                    this.hide()
                }
            })
        }
    }

    show(){
        // Create the modal
        this.panel = document.createElement('DIV')
        this.panel.id = Helpers.generateUid()
        this.panel.classList.add( 'modal-panel' )
        this.panel.classList.add( `modal-panel-${this.type}`)
        // Flag whether can select the modal panel to close the modal
        // (as well as use the escape key)
        this.panel.classList.add( this.escape ? 'escape' : 'no-escape')
        this.panel.innerHTML = this.template()
        // Add modal to the document
        document.querySelector('body').appendChild(this.panel)
        // Add event listeners
        this.addEventListeners()
        // Add the show class
        setTimeout( () => {
            this.panel.classList.add('show')
        }, 10 )
    }

}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export default Modal
