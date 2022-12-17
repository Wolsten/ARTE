import ToolbarButton from "../ToolbarButton";
import * as Icons from '../icons'
import Editor from '../Editor'



export default class BufferButton extends ToolbarButton {

    editor: Editor

    constructor(editor: Editor, kind: string) {

        kind = kind.toUpperCase()
        if (kind === 'UNDO') {
            super('detached', 'UNDO', 'Undo', Icons.undo, { update, buffering, restart, pause })
        } else {
            super('detached', 'REDO', 'Redo', Icons.redo)
        }
        this.editor = editor
    }


    /**
     * If available update the editor content with the last but one
     * entry in the buffer
     */
    undo(): void {
        if (this?.editor?.buffer) {
            this.editor.buffer.pause()
            this.editor.buffer.index--
            this.editor.buffer.ignore = true
            console.warn(this.editor.buffer.index)
            this.editor.editorNode.innerHTML = this.editor.buffer.items[this.editor.buffer.index]
        }
        this.setState()
        // if ( editor.options.debug ){
        //     console.log('buffer',buffer.buffer)
        //     console.log('buffer index', buffer.index)
        // }
        this.editor.updateEventHandlers()
    }


    /**
     * If available update the editor content with the next but one
     * entry in the buffer
     */
    redo(): void {
        if (this?.editor?.buffer) {
            if (this.editor.buffer.index + 1 < this.editor.buffer.items.length) {
                this.editor.buffer.index++
                this.editor.buffer.ignore = true
                this.editor.editorNode.innerHTML = this.editor.buffer.items[this.editor.buffer.index]
            }
            this.setState()
            this.editor.updateEventHandlers()
        }
        // if ( editor.options.debug ){
        //     console.log('buffer',buffer.buffer)
        //     console.log('buffer index', buffer.index)
        // }   
    }


    /**
     * Set the disabled and active states of a buffer (for a specific editor)
     */
    setState(): void {
        if (this?.editor?.buffer) {
            if (this.tag === 'UNDO') {
                this.editor.disabled = this.editor.buffer.items.length <= 1 || this.editor?.buffer.index <= 0
            } else {
                this.editor.disabled = this.editor.buffer.index >= this.editor.buffer.items.length - 1
            }
        }
    }

}
