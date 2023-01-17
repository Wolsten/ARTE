/**
 * Add comments within text
 * 
 * File format:
 *   Paragraph text <ARTE-COMMENT id ="id" data-comment="comment" data-created="date" data-updated="date" data-resolved="true|false">target text</arte-comment> more paragraph text
 * 
 * Editor format:
 *   <ARTE-COMMENT id ="id" data-comment="comment" data-created="date" data-updated="date" data-resolved="true|false" contenteditable="false">
 *      <button type="button" title="edit this comment">target text</button>
 *      <i>icon</i>
 *   </ARTE-COMMENT>
 * 
 * Sidebar format:
 * <article>
 *      <a href="#id" title="Click to view comment">
 *          <span class="comment-bubble comment-resolved|comment-unresolved"><i>icon</i></span> comment
 *      </a>
 *      <p class="sub-title">Added: $date</p>
 * </article>
 * 
 */

import * as Icons from '../icons'
import * as Helpers from '../helpers'
import { Modal, ModalButton, ModalButtonAction, ModalOptionsType } from '../Modal'
import SidebarButton from '../SidebarButton'
import Editor from '../Editor'
import CustomBlock from './CustomBlock'
import BufferButton from './BufferButton'



export default class CustomComment extends CustomBlock {


    target = ''

    constructor(editor: Editor, group: number) {
        super(editor, 'ARTE-COMMENT', 'Comment', Icons.comment, group)
    }


    /**
     * Show the custom dialogue for new creation or editing
     */
    show(): void {
        // if (!this.editor.range) {
        //     console.warn('No selection to add comment to')
        //     return
        // }
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'Cancel'),
        ]
        if (this.editFlag) {
            buttons.push(new ModalButton(ModalButtonAction.Delete, 'Delete', () => this.handleDelete(), 'comment'))
        } else if (!this.editor.range?.selectedText) {
            // No selection
            return
        } else {
            // Initialise an action as saved to file
            this.node = document.createElement(this.tag)
            if (!this.node) {
                console.error(`Failed to create new ${this.label}`)
                return
            }
            this.node.id = Helpers.generateUid()
            this.setAttribute('contenteditable', 'false')
            this.setAttribute('comment', '')
            this.setAttribute('created', '')
            this.setAttribute('updated', '')
            this.setAttribute('resolved', 'false')
            this.setAttribute('resolved', this.editor.range.selectedText)
        }
        // Create and display the modal panel
        buttons.push(new ModalButton(ModalButtonAction.Confirm, 'Save', () => this.save()))
        const options: ModalOptionsType = { focusId: 'comment' }
        const title = (this.editFlag ? 'Edit ' : 'Create ') + this.label
        this.drawer = new Modal(title, this.form(), buttons, options)

        const resolveButton = this.drawer.getInputElement('button#resolve')
        if (resolveButton) {
            resolveButton.addEventListener('click', () => this.handleResolvebutton(resolveButton))
        }
    }


    handleResolvebutton(button: HTMLElement) {

        const resolved = this.getAttribute('resolved')
        console.log('Handling resolve button with resolve set to ', resolved)
        if (resolved == 'true') {
            this.setAttribute('resolved', 'false')
        } else {
            this.setAttribute('resolved', 'true')
        }
        console.log('Handling resolve button with resolve NOW set to ', resolved)
        button.innerHTML = this.resolveLabel()
    }



    /**
     * Generate html for a dialogue to create/edit a link
     * Returns HTML string
     */
    form(): string {
        const created = this.getAttribute('created')
        const updated = this.getAttribute('updated')
        const comment = this.getAttribute('comment')
        const target = this.getAttribute('target')
        let timestamps = ''
        let resolve = ''
        if (created != '') {
            timestamps = `<span><label>Created</label> ${created}</span>`
        }
        if (updated != '') {
            timestamps += `<span><label>Updated</label> ${updated}</span>`
        }
        if (timestamps != '') {
            timestamps = `<div class="timestamps">${timestamps}</div>`
            const title = this.resolveLabel()
            resolve = `<button type="button" id="resolve">${title}</button>`
        }
        return `<div class="arte-comment">
                    <label>Text targeted by comment</label>
                    <p class="selected-text">${target}</p>
                    <div class="form-input"> 
                        <label for="comment">Comment</label>
                        <textarea id="comment" class="form-control" placeholder="Enter your comment" required>${comment}</textarea>
                    </div>
                    ${timestamps}
                    ${resolve}
                </div>`
    }


    private resolveLabel() {
        return this.getAttribute('resolved') == 'true'
            ? Icons.commentUnresolve + ' Unresolve'
            : Icons.commentResolve + ' Resolve'
    }


    /**
    * Save the new or edited custom element
    */
    save(): void {
        if (!this.drawer) {
            console.error('No drawer is displayed')
            return
        }
        // console.log('Save changes')'
        this.setAttributes(['comment'], this.drawer)
        // Timestamps
        const timestamp = new Date()
        const localTimestamp = timestamp.toLocaleString().slice(0, -3)
        if (this.editFlag) {
            this.setAttribute('updated', localTimestamp)
        } else {
            this.setAttribute('created', localTimestamp)
            // this.append()
            this.replace()
        }
        this.tidyUp()
    }


    /**
     * Template for how the action is presented in the editor
     */
    // template(): string {
    //     return `<button type="button" title="edit this comment">
    //                 <i>${Icons.comment}</i>
    //             </button>`
    // }

    template(): string {
        const target = this.getAttribute('target')
        return `<button type="button" title="edit this comment">${target}</button><i>${Icons.comment}</i>`
    }


    /**
     * Display custom html in the sidebar
     */
    sidebar(): SidebarButton {
        const comments = this.editor.editorNode?.querySelectorAll(this.tag)
        let content = ''
        if (comments) {
            comments.forEach(comment => {
                const created = this.getAttribute('created', comment)
                const commentText = this.getAttribute('comment', comment)
                const resolved = this.getAttribute('resolved', comment) === 'true' ? 'comment-resolved' : 'comment-unresolved'
                content += `
                    <article class="comment">
                        <a href="#${comment.id}" title="Click to view comment in context">
                            <span class="comment-bubble ${resolved}">${Icons.commentEdit}</span> ${commentText}
                        </a>
                        <p class="sub-title">Added: ${created}</p>
                    </article>`
            })
        }
        return new SidebarButton(Icons.comment, 'comments', content)
    }


}