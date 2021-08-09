"use strict"

let panel = null

function form(title,message,cancel,confirm){
    if ( cancel == undefined ){
        cancel = 'No - stay here'
    }
    if ( confirm == undefined ){
        confirm = 'Yes - lose changes'
    }
    return `
        <div class="modal-confirm-container">
            <header class="modal-confirm-header">
                <h3 class="modal-confirm-title">${title}</h3>
            </header>
            <div class="modal-confirm-message">${message}</div>
            <div class="modal-confirm-buttons">
                <button type="button" class="cancel">${cancel}</button>
                <button type="button" class="confirm">${confirm}</button>
            </div>
        </div>`
}


// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const hide = function(){
    panel.classList.remove('show')
    setTimeout( ()=>{
        panel.remove()
        panel = null
    }, 500 )
}

export const show = function( title, message, cancel, confirm){
    if ( cancel == undefined ){
        cancel = 'No - stay here'
    }
    if ( confirm == undefined ){
        confirm = 'Yes - lose changes'
    }
    panel = document.createElement('DIV')
    panel.classList.add('modal-confirm')
    panel.innerHTML = form(title,message, cancel, confirm)
    panel.querySelector('button.cancel').addEventListener('click', event => {
        event.stopPropagation()
        hide()
    })
    document.querySelector('body').appendChild(panel)
    // Invoke with arrow function, otherwise this will be the current window
    setTimeout( () => {
        panel.classList.add('show')
    }, 10 )
    return panel.querySelector('button.confirm')
}
