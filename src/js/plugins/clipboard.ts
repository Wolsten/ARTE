/** 
 * Handle cut, copy and paste
 */

import ToolbarButton, { ToolbarButtonType } from '../ToolbarButton'
import * as Icons from '../icons'
import * as Helpers from '../helpers'
import { ModalWarning } from '../Modal'
import Editor from '../Editor'



export default class Clipboard extends ToolbarButton {


    private supported = false

    constructor(editor: Editor, tag: string, group: number) {

        tag = tag.toUpperCase()

        switch (tag) {
            case 'CUT':
                super(editor, ToolbarButtonType.DETACHED, tag, 'Cut (text only - use Ctr-V or Cmd-V to include formatting)', Icons.cut, group)
                return
            case 'COPY':
                super(editor, ToolbarButtonType.DETACHED, tag, 'Copy (text only - use Ctr-V or Cmd-V to include formatting)', Icons.copy, group)
                return
        }
        super(editor, ToolbarButtonType.DETACHED, tag, 'Paste (text only - use Ctr-V or Cmd-V to include formatting)', Icons.paste, group)
    }


    /**
     * Optional method that, on first load of editor, converts the minimal custom 
     * HTML into the full editable version
     */
    init() {
        if (navigator.clipboard && this.editor.editorNode) {
            this.supported = true
            // Event listeners
            this.editor.editorNode.addEventListener('cut', this.cutCopyHandler)
            this.editor.editorNode.addEventListener('copy', this.cutCopyHandler)
            this.editor.editorNode.addEventListener('paste', this.pasteHandler)
        }
    }


    click() {
        if (this.supported === false) {
            return
        }
        switch (this.tag) {
            case 'CUT':
                this.cut()
                break
            case 'COPY':
                this.copy()
                break
            case 'PASTE':
                this.paste()
        }
    }


    /**
     * Set the disabled and active states of the paste button
     */
    async setState() {
        if (!this.editor.editorNode) return
        // console.log('set state for button', this.tag)
        switch (this.tag) {
            case 'PASTE':
                if (document.activeElement == this.editor.editorNode) {
                    const text = await navigator.clipboard.readText()
                    this.disabled = text == ''
                } else {
                    this.disabled = true
                }
                break
            case 'CUT':
            case 'COPY':
                if (!this.editor.range || this.editor.range.collapsed) {
                    this.disabled = true
                } else {
                    this.disabled = false
                }
        }
        // All buttons disabled (if not already) if selection contains any custom elements
        if (this.disabled == false) {
            this.disabled = this.editor.range?.containsCustoms() || false
            // const selection = document.getSelection()
            // this.disabled = Helpers.selectionContainsCustoms(this.editor.editorNode, selection)
        }

        if (this.disabled) {
            this.element?.setAttribute('disabled', 'disabled')
        } else {
            this.element?.removeAttribute('disabled')
        }
    }


    // -----------------------------------------------------------------------------
    // @section Private methods
    // -----------------------------------------------------------------------------


    /**
     * Prevent clipboard events which include custom nodes. Returns  true if found customs 
     * in selection, else false
     */
    private prevent(selection: Selection): boolean {
        const contains = Helpers.selectionContainsCustoms(this.editor.editorNode, selection)
        if (contains) {
            const html = `<p>Cut, copy and paste (of or over) selections with active elements, such as comments or links, is not supported.</p>
                          <p>Please modify your selection and try again.</p>`
            new ModalWarning('Information', html)
            return true
        }
        return false
    }



    /**
     * Handle cut and copy events
     */
    private cutCopyHandler(event: Event) {
        const selection = document.getSelection()
        if (selection && this.prevent(selection)) {
            event.preventDefault()
        }
        if (event.type == 'cut') {
            this.bufferDelayed()
        }
    }



    /**
     * Handle cut button clicks
     */
    private cut() {
        const selection = document.getSelection()
        if (selection && this.prevent(selection) == false) {
            // console.log('selection', selection.toString())
            navigator.clipboard.writeText(selection.toString())
            selection.deleteFromDocument()
            this.bufferDelayed()
        }
    }



    /**
     * Handle cut button clicks
     */
    private copy() {
        const selection = document.getSelection()
        if (selection && this.prevent(selection) == false) {
            // console.log('selection', selection.toString())
            navigator.clipboard.writeText(selection.toString())
        }
    }


    /**
     * Handle paste button clicks
     */
    private async paste() {
        const selection = document.getSelection()
        if (selection && this.prevent(selection) == false) {
            const text = await navigator.clipboard.readText()
            console.log('pasted text is ', text)
            let node = document.createTextNode(text)
            node = Helpers.replaceSelectionWithNode(this.editor, node)
            this.bufferDelayed()
        }
    }


    /**
     * Handle paste events
     */
    private pasteHandler(event: ClipboardEvent) {
        const selection = document.getSelection()
        if (selection && this.prevent(selection) == false && event.clipboardData) {
            // window.clipboardData not recognised by typescript - ignore older browsers
            // const paste = (event.clipboardData || window.clipboardData).getData('text/html');
            const paste = event.clipboardData.getData('text/html');
            // Detect pasting from Microsoft Office and paste as plain text
            if (this.supported && paste.includes('urn:schemas-microsoft-com:office')) {
                console.log('Found word data')
                // Get plain text
                const text = event.clipboardData.getData('text/plain');
                console.log('text\n', text)
                event.preventDefault()
                // Special handling of paste
                let node = document.createTextNode(text)
                node = Helpers.replaceSelectionWithNode(this.editor, node)
            }
            this.bufferDelayed()
        }
    }


    private bufferDelayed() {
        setTimeout(() => this.editor.updateBuffer, 100)
    }
}
