class ToolbarButton {

    constructor( type, tag, label, icon, click, options ){
        this.type = type
        this.tag = tag
        this.label = label
        this.icon = icon
        this.click = click  // Undefined for buffer buttons but must be here
        this.element = null // Populated by editor
        // default disabled method
        this.disabled = range => {
            if ( range === false ){
                this.element.disabled = true
                this.element.classList.remove('active')
            } else {
                this.element.disabled = false
            }
        }
        // Optional parameters
        if ( options != undefined ){
            if ( options.init != undefined ){
                this.init = options.init
            }
            if ( options.disabled != undefined ){
                this.disabled = options.disabled
            }
            if ( options.shortcut != undefined ){
                this.shortcut = options.shortcut
            }
            if ( options.addEventHandlers != undefined ){
                this.addEventHandlers = options.addEventHandlers
            }
            if ( options.clean != undefined ){
                this.clean = options.clean
            }
        }
    }

    // // Default disabled method
    // disabled(range){
    //     if ( range === false ){
    //         this.element.disabled = true
    //         this.element.classList.remove('active')
    //     } else {
    //         this.element.disabled = false
    //     }
    // }

}

export default ToolbarButton