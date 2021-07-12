class ToolbarButton {

    constructor( type, tag, label, icon, click, options ){
        this.type = type
        this.tag = tag
        this.label = label
        this.icon = icon
        this.click = click
        // Optional parameters
        if ( options != undefined ){
            if ( options.init != undefined ){
                this.init = options.init
            }
            if ( options.shortcut != undefined ){
                this.shortcut = options.shortcut
            }
            if ( options.eventHandlers != undefined ){
                this.eventHandlers = options.eventHandlers
            }
            if ( options.clean != undefined ){
                this.clean = options.clean
            }
        }
    }

    disabled(range){
        return true
    }

}

export default ToolbarButton