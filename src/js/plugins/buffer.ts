import Editor from '../Editor'
import BufferButton from './BufferButton'


export default class Buffer {

    // Max possible (overrides user option)
    readonly MAX_BUFFER_SIZE = 10

    size: number = 0
    index: number = -1
    ignore: boolean = false
    items: string[] = []
    editor: Editor
    buffering: boolean = false

    undoButton: BufferButton
    redoButton: BufferButton



    constructor(editor: Editor, undoButton: BufferButton, redoButton: BufferButton, size: number) {
        this.editor = editor
        this.undoButton = undoButton
        this.redoButton = redoButton
        this.size = size > 0 && size <= this.MAX_BUFFER_SIZE ? size : this.MAX_BUFFER_SIZE
    }



    /**
     * Add a new item to the editor buffer and if required remove the first entry
     * when the maximum buffer size is reached
     */
    update() {
        // Check that the new value is different
        if (this.items.length > 0 &&
            this.editor.editorNode.innerHTML == this.items[this.items.length - 1]) {
            return
        }
        if (this.items.length > this.size) {
            // Remove first element
            this.items.shift()
        }
        // Check buffer index in case need to reset buffer when the user had
        // undone and then made new changes
        if ((this.index + 1) < this.items.length) {
            const items = this.items.length - (this.index + 1)
            for (let i = 0; i < items; i++) {
                this.items.pop()
            }
        }

        // Add the new one
        this.items.push(this.editor.editorNode.innerHTML)
        this.index = this.items.length - 1
        // Update buttons
        this.undoButton.setState()
        this.redoButton.setState()
        // Debug
        // if ( editor.options.debug ){
        //     console.log('buffer',buffer.buffer)
        //     console.log('index', buffer.index)
        // }
    }


    /**
     * Pause buffering for one cycle
     */
    pause(): void {
        this.buffering = false
    }


}