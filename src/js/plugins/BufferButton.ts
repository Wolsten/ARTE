import ToolbarButton, { ToolbarButtonType } from "../ToolbarButton";
import * as Icons from '../icons'
import Editor from '../Editor'



export default class BufferButton extends ToolbarButton {


    constructor(editor: Editor, tag: string, group: number) {

        tag = tag.toUpperCase()

        if (tag === 'UNDO') {
            super(editor, ToolbarButtonType.DETACHED, tag, 'Undo', Icons.undo, group)
        } else {
            super(editor, ToolbarButtonType.DETACHED, tag, 'Redo', Icons.redo, group)
        }
    }


    click(): void {
        if (this.tag === 'UNDO') {
            this.undo()
        } else {
            this.redo()
        }
    }


    /**
     * Set the disabled and active states of a buffer (for a specific editor)
     */
    setState(): void {
        if (!this.editor.editorNode || !this.editor.buffer) return
        if (this.tag === 'UNDO') {
            this.editor.disabled = this.editor.buffer.items.length <= 1 || this.editor.buffer.index <= 0
        } else {
            this.editor.disabled = this.editor.buffer.index >= this.editor.buffer.items.length - 1
        }
    }


    /**
     * If available update the editor content with the last but one
     * entry in the buffer
     */
    private undo(): void {
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
    private redo(): void {
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




}
