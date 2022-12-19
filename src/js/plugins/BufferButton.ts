import ToolbarButton from "../ToolbarButton";
import * as Icons from '../icons'
import Editor from '../Editor'



export default class BufferButton extends ToolbarButton {


    constructor(editor: Editor, type: string, group: number) {

        type = type.toUpperCase()
        if (type === 'UNDO') {
            super(editor, 'detached', type, 'Undo', Icons.undo, group)
        } else {
            super(editor, 'detached', type, 'Redo', Icons.redo, group)
        }
    }


    click(): void {
        if (this.type === 'UNDO') {
            this.undo()
        } else {
            this.redo()
        }
    }


    /**
     * If available update the editor content with the last but one
     * entry in the buffer
     */
    undo(): void {
        if (!this.editor.editorNode || !this.editor.buffer) return

        this.editor.buffer.pause()
        this.editor.buffer.index--
        this.editor.buffer.ignore = true

        console.log(this.editor.buffer.index)
        this.editor.editorNode.innerHTML = this.editor.buffer.items[this.editor.buffer.index]

        this.setState()

        this.editor.updateEventHandlers()

        // if ( editor.options.debug ){
        //     console.log('buffer',buffer.buffer)
        //     console.log('buffer index', buffer.index)
        // }
    }


    /**
     * If available update the editor content with the next but one
     * entry in the buffer
     */
    redo(): void {
        if (!this.editor.editorNode || !this.editor.buffer) return

        if (this.editor.buffer.index + 1 < this.editor.buffer.items.length) {
            this.editor.buffer.index++
            this.editor.buffer.ignore = true
            this.editor.editorNode.innerHTML = this.editor.buffer.items[this.editor.buffer.index]
        }
        this.setState()

        this.editor.updateEventHandlers()

        // if ( editor.options.debug ){
        //     console.log('buffer',buffer.buffer)
        //     console.log('buffer index', buffer.index)
        // }   
    }


    /**
     * Set the disabled and active states of a buffer (for a specific editor)
     */
    setState(): void {
        if (!this.editor.editorNode || !this.editor.buffer) return
        if (this.tag === 'UNDO') {
            this.editor.disabled = this.editor.buffer.items.length <= 1 || this.editor?.buffer.index <= 0
        } else {
            this.editor.disabled = this.editor.buffer.index >= this.editor.buffer.items.length - 1
        }
    }

}
