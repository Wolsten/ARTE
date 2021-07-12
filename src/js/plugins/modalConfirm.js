"use strict"

let panel = null

function form(title,message){
    return `
        <div class="modal-confirm-container">
            <header class="modal-confirm-header">
                <h3 class="modal-confirm-title">${title}</h3>
            </header>
            <div class="modal-confirm-message">${message}</div>
            <div class="modal-confirm-buttons">
                <button type="button" class="cancel">No - stay here</button>
                <button type="button" class="confirm">Yes - lose changes</button>
            </div>
        </div>`
}

function delayedRemove(){
    panel.remove()
    panel = null
}

function delayedShow(){
    panel.classList.add('show')
}


// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const hide = function(){
    panel.classList.remove('show')
    setTimeout( ()=>delayedRemove(), 500 )
}

export const show = function( title, message ){
    panel = document.createElement('DIV')
    panel.classList.add('modal-confirm')
    panel.innerHTML = form(title,message)
    panel.querySelector('button.cancel').addEventListener('click', event => {
        event.stopPropagation()
        hide()
    })
    document.querySelector('body').appendChild(panel)
    // Invoke with arrow function, otherwise this will be the current window
    setTimeout( () => delayedShow(), 10 )
    return panel.querySelector('button.confirm')
}
