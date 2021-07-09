"use strict"

export default class ModalConfirm {

    constructor(){
        this.panel = null
    }

    form(title,message){
        return `
            <div class="custom-modal-container">
                <div class="header">
                    <h5 class="custom-modal-title">${title}</h5>
                </div>
                <div class="custom-modal-message">${message}</div>
                <div class="custom-modal-buttons">
                    <button type="button" class="cancel">No - stay here</button>
                    <button type="button" class="confirm">Yes - lose changes</button>
                </div>
            </div>`
    }

    hide(){
        this.panel.classList.remove('show')
        setTimeout( ()=>this.delayedRemove(), 500 )
    }

    delayedRemove(){
        this.panel.remove()
        this.panel = null
    }

    delayedShow(){
        this.panel.classList.add('show')
    }

    show( title, message ){
        this.panel = document.createElement('DIV')
        this.panel.classList.add('modal-confirm')
        this.panel.innerHTML = this.form(title,message)
        this.panel.querySelector('button.cancel').addEventListener('click', event => {
            event.preventPropagation()
            this.hide()
        })
        document.querySelector('body').appendChild(this.panel)
        // Invoke with arrow function, otherwise this will be the current window
        setTimeout( () => this.delayedShow(), 10 )
        return this.panel.querySelector('button.confirm')
    }
}