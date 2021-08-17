import * as Icons from './icons.js'
import * as Helpers from './helpers.js'


let modal = null
let container = null

let options = {
    editor:null,
    title: '',
    html:'',
    delay:500,
    severity:'',
    buttons:[],
    type: 'feedback',
    escape:false
}

/**
 * Get the position for the input dialogue based on current range
 */
 function positionContainer(){
    container = modal.querySelector('.modal-panel-container')
    let pos
    // If this is not a text node then get the first text node
    // Can happen at the start of a line when backspace to the start
    if ( options.editor.range.startContainer.nodeType !== 3 ){
        if ( options.editor.range.startContainer.childNodes.length>0 ){
            let node = options.editor.range.startContainer.childNodes[0]
            pos = node.getBoundingClientRect()
        } else {
            pos = {x:options.editor.editorNode.offsetLeft, y:options.editor.editorNode.offsetTop}
        }
    // Text node
    } else {
        pos = options.editor.range.getBoundingClientRect()
        //console.log('text node const ',pos)
    }
    if ( (pos.x + container.outerWidth) > window.innerWidth ){
        pos.x = window.innerWidth - container.outerWidth - 20;
    }
    if ( (pos.y + container.outerHeight) > window.innerHeight ){
        pos.y = window.innerHeight - container.outerHeight - 40;
    }
    container.style.top = `${pos.y}px`
    container.style.left = `${pos.x}px`
} 

function template(){
    let html = `<div class="modal-panel-container">`
    let icon = ''
    switch(options.severity){
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
    if ( options.title ){
        html += `
            <header class="modal-panel-header">
                <h3 class="modal-panel-title">${icon}${options.title}</h3>
            </header>`
    }
    if ( options.html ){
        html += `<div class="modal-panel-body">${options.html}</div>`
    }
    if ( options.buttons.length > 0 ){
        html += `<div class="modal-panel-buttons">`
        options.buttons.forEach( button => {
            html += `<button type="button" class="${button.class}">${button.label}</button>`
        })
        html += `</div>`
    }
    html += `</div>`
    return html
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

/**
 * Hide current panel by removing transition class "show" and then removing from
 * the dom.
 */
 export const hide = function(){
    modal.classList.remove('show')
    setTimeout( ()=>{
        modal.remove()
        modal = null
    }, options.delay ? options.delay : 10 )
}

/**
 * Show the modal panel using transition class "show"
 * @param {object} opts 
 */
 export const show = function( opts ){
    // Overwrite options if supplied
    for( let option in options ){
        if ( opts[option] ){
            options[option] = opts[option]
        }
    }
    modal = document.createElement('DIV')
    modal.classList.add( 'modal-panel' )
    modal.classList.add( `modal-panel-${options.type}`)
    modal.setAttribute('data-modal-active',true)
    modal.innerHTML = template()
    
    document.querySelector('body').appendChild(modal)
    // Add event listeners
    options.buttons.forEach( button => {
        if ( button.class=='hide' ){
            const btn = modal.querySelector('button.hide')
            if ( btn ){
                btn.addEventListener('click', hide)
            }
        } else if ( button.class=='confirm' ){
            const btn = modal.querySelector('button.confirm')
            if ( btn ){
                btn.addEventListener('click', ()=> {
                    hide()
                    if ( button.callback ){
                        button.callback()
                    }
                })
            }
        } else if ( button.class=='delete' ){
            const btn = modal.querySelector('button.delete')
            if ( btn ){
                btn.addEventListener('click', ()=> {
                    hide()
                    if ( button.callback ){
                        button.callback()
                    }
                })
            }
        }
    })
    // Position the container
    
    if ( options.type == 'positioned' && options.editor ){
        positionContainer()

    }
    // Support escape key?
    if ( options.escape ){
        document.addEventListener('keydown', event => {
            if ( event.key == 'Escape' ){
                event.stopPropagation()
                hide()
            }
        })
    }
    // Invoke with arrow function, otherwise this will be the current window
    setTimeout( () => {
        modal.classList.add('show')
    }, 10 )
    return modal
}

export const getConfirmButton = function(){
    return modal.querySelector('button.confirm')
}
