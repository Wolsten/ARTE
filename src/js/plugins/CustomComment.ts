/**
 * Add comments to paragraphs
 * 
 * File format:
 *   <ARTE-COMMENT id ="id" data-comment="comment" data-created="date" data-updated="date" data-resolved="true|false"></arte-comment>
 * 
 * Editor format:
 *   <ARTE-COMMENT id ="id" data-comment="comment" data-created="date" data-updated="date" data-resolved="true|false" contenteditable="false">
 *      <button type="button" title="edit this comment"><i>icon</i></button>
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



export default class CustomComment extends CustomBlock {

    constructor(editor: Editor, group: number) {
        super(editor, 'ARTE-COMMENT', 'Comment', Icons.comment, group)
    }


    /**
     * Show the custom dialogue for new creation or editing
     */
    show(): void {
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'Cancel'),
        ]
        if (this.editFlag) {
            buttons.push(new ModalButton(ModalButtonAction.Delete, 'Delete', () => this.handleDelete(), 'comment'))
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
        }
        // Create and display the modal panel
        buttons.push(new ModalButton(ModalButtonAction.Confirm, 'Save', () => this.save()))
        const options: ModalOptionsType = {
            focusId: 'comment',
            formClass: 'comment'
        }
        this.drawer = new Modal(`${this.editFlag ? 'Edit' : 'Create'} ` + this.label, this.form(), buttons, options)
    }


    /**
     * Generate html for a dialogue to create/edit a link
     * Returns HTML string
     */
    form(): string {
        const created = this.getAttribute('created')
        const updated = this.getAttribute('updated')
        const comment = this.getAttribute('comment')
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
        return `<div class="form-input">
                    <textarea id="comment" class="form-control" placeholder="Enter your comment" required>${comment}</textarea>
                </div>
                ${timestamps}
                ${resolve}`
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
            this.insert()
        }
        // Close the modal
        this.drawer.hide()
        // Format the saved action
        this.format()
        // Update the buffer
        this.editor.updateBuffer()
    }


    /**
     * Template for how the action is presented in the editor
     */
    template(): string {
        return `<button type="button" title="edit this comment">
                    <i>${Icons.comment}</i>
                </button>`
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