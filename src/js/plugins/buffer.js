import * as Icons from './icons.js'
import ToolbarButton from './ToolbarButton.js'


export default class Buffer {

    constructor( size, updateEventHandlers ){
        this.size = size
        this.bufferIndex = 0
        this.buffer = []
        // Buttons 
        this.undoButton = new ToolbarButton(5, 'buffer','UNDO','Undo', Icons.undo)
        this.redoButton = new ToolbarButton(5, 'buffer','REDO','Redo', Icons.redo)
        // Set this to true when undoing/redoing so can ignore mutations 
        // due to these actions
        this.ignore = false
    }

    init(target){
        this.target = target
        this.buffer = [this.target.innerHTML]
        this.target.addEventListener('editor-updated', () => {
            this.update()
        })
    }

    setButtonStates(){
        this.disabled(this.undoButton)
        this.disabled(this.redoButton)
    }

    undo(){
        if ( this.bufferIndex > 0 ){
            this.bufferIndex --
            this.target.innerHTML = this.buffer[this.bufferIndex]
        }
        this.setButtonStates()
    }

    redo(){
        if ( this.bufferIndex + 1 < this.buffer.length ){
            this.bufferIndex ++
            this.target.innerHTML = this.buffer[this.bufferIndex]
        }
        this.setButtonStates()
    }

    click(button){
        if ( button.tag == 'UNDO' ){
            this.undo()
        } else {
            this.redo()
        }
        this.disabled(button)
        this.ignore = true
    }

    ignoreMutation(){
        let result = this.ignore
        this.ignore = false
        return result
    }

    disabled(button){
        if ( button.tag == 'UNDO' ){
            button.element.disabled = this.buffer.length==0 || this.bufferIndex==0
        } else {
            button.element.disabled = this.bufferIndex >= this.buffer.length - 1
        }
        //console.warn(`set button ${button.tag} disabled flag to be ${button.element.disabled}`)
    }

    update(){
        if ( this.size == 0 ){
            return
        }
        if ( this.buffer.length > this.size ){
            // Remove first element
            this.buffer.shift()
        }
        // Check buffer index in case need to reset buffer when the user had
        // undone and then made new changes
        if ( (this.bufferIndex + 1) < this.buffer.length ){
            const items = this.buffer.length - (this.bufferIndex + 1)
            for( let i=0; i<items; i++){
                this.buffer.pop()
            }
        }
        // Add the new one
        this.buffer.push(this.target.innerHTML)
        this.bufferIndex = this.buffer.length - 1
        console.log('buffer', this.buffer)
        // Update buttons
        this.setButtonStates()
    }
}
