/** 
 * 
 * File format (optional due date):
 * <ARTE-ACTION 
 *      id="id" 
 *      data-status="0" 
 *      data-todo="todo" 
 *      data-owners="owners" 
 *      data-due="due" 
 *      data-created="date" 
 *      data-updated="date" 
 *      data-notes="Some notes">
 * </ARTE-ACTION>
 * 
 * 
 * Editor format (optional due date):
 * <ARTE-ACTION 
 *      id="id" 
 *      data-status="0" 
 *      data-todo="todo" 
 *      data-owners="owners" 
 *      data-due="due" 
 *      data-created="date" 
 *      data-updated="date" 
 *      data-notes="Some notes"
 *      contenteditable="false" >
 *    <button type="button" title="Click to edit action">
 *        <label class="status-open|status-closed-incomplete|status-closed-complete"><i>icon</i></label>
 *        <span class="todo">todo</span>
 *        <label>Owners:</label>
 *        <span class="owners">owners</span>
 *        [<label>Due:</label>
 *        <span class="due">date</span>]
 *    </button>
 * </ARTE-ACTION>
 * 
 * 
 * Sidebar format (optional due date):
 * <article class="action">
 *      <a href="#id">todo</a>
 *      <p>Owned by: owners}[,<br/>Due: date]</p>
 * </article>`
 */

import * as Icons from '../icons'
import * as Helpers from '../helpers'
import { Modal, ModalButton, ModalButtonAction, ModalOptionsType } from '../Modal'
import SidebarButton from '../SidebarButton'
import Editor from '../Editor'
// import { EditButtons } from './interfaces'
import CustomBlock from './CustomBlock'


export default class Actions extends CustomBlock {

    static readonly TAG = 'ARTE-ACTION'        // The HTMLElement tag as inserted in the dom for this custom node


    constructor(editor: Editor, group: number) {
        super(editor, 'custom', Actions.TAG, Icons.action, group)
    }


    // -----------------------------------------------------------------------------
    // @section Action specific methods
    // -----------------------------------------------------------------------------


    /**
     * Show the custom dialogue for new creation or editing
     */
    show(editFlag: boolean): void {
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'Cancel'),
        ]
        if (editFlag) {
            buttons.push(new ModalButton(ModalButtonAction.Delete, 'Delete', this.handleDelete, 'action'))
        } else {
            // Initialise an action as saved to file
            this.node = document.createElement(this.tag)
            if (!this.node) {
                console.error(`Failed to create new ${this.label}`)
                return
            }
            this.node.id = Helpers.generateUid()
            this.setAttribute('contenteditable', 'false')
            this.setAttribute('status', '0')
            this.setAttribute('todo', '')
            this.setAttribute('owners', '')
            this.setAttribute('due', '')
            this.setAttribute('created', '')
            this.setAttribute('updated', '')
            this.setAttribute('notes', '')
        }
        buttons.push(new ModalButton(ModalButtonAction.Confirm, 'Save', this.save))

        // Options
        const options: ModalOptionsType = {
            focusId: 'todo'
        }

        // Create and display the modal panel
        this.drawer = new Modal(`${editFlag ? 'Edit' : 'Action'} action`, this.form(), buttons, options)
    }


    /**
     * Form template - returns generated html
    */
    form(): string {
        const todo = this.getAttribute('todo')
        const owners = this.getAttribute('owners')
        const status = this.getAttribute('status')
        const due = this.getAttribute('due')
        const notes = this.getAttribute('notes')
        return `<div class="form-input">
                    <label for="todo">What needs to be done</label>
                    <textarea id="todo" class="form-control" required>${todo}</textarea>
                </div>
                <div class="form-input">
                    <label for="owners">Owners</label>
                    <input type="text" id="owners" class="form-control" value="${owners}" required />
                </div>
                <div class="form-input">
                    <label for="due">Due by</label>
                    <input type="text" id="due" class="form-control" value="${due}"/>
                </div>
                <div class="form-input">
                    <label for="status">Status</label>
                    <select id="status" class="form-control">
                        <option value="0" ${status == '0' ? 'selected' : ''}>Open</option>
                        <option value="1" ${status == '1' ? 'selected' : ''}>Closed - Incomplete</option>
                        <option value="2" ${status == '2' ? 'selected' : ''}>Closed - Complete</option>
                    </select>
                </div>
                <div class="form-input">
                    <label for="notes">Notes</label>
                    <textarea id="notes" class="form-control">${notes}</textarea>
                </div>`
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
        this.setAttributes(['todo', 'owners', 'due', 'status', 'notes'], this.drawer)
        // Timestamp
        const timestamp = new Date()
        const localTimestamp = timestamp.toLocaleString().slice(0, -3)
        if (this.getAttribute('created') == '') {
            this.setAttribute('created', localTimestamp)
            this.insert()
        } else {
            this.setAttribute('updated', localTimestamp)
        }
        // Close the modal
        this.drawer.hide()
        // Format the saved action
        this.format(this.template)
    }


    /**
     * late for how the action is presented in the editor
     */
    template(): string {
        const todo = this.getAttribute('todo')
        const owners = this.getAttribute('owners')
        const status = this.getAttribute('status')
        const statusClass = this.getStatusClass(status)
        let due = this.getAttribute('due')
        if (due) due = `<label>Due:</label><span class="due">${due}</span>`
        return `<button type="button" title="Edit this action">
                    <label class="${statusClass}">${Icons.action}</label>
                    <span class="todo">${todo}</span>     
                    <label>Owners:</label>  
                    <span  class="owners"> ${owners} </span>
                    ${due}
                </button>`
    }


    getStatusClass(status: string) {
        switch (parseInt(status)) {
            case 0: return 'status-open'
            case 1: return 'status-closed-incomplete'
            case 2: return 'status-closed-complete'
        }
        return 'status-unknown'
    }


    /**
     * Display custom html in the sidebar
     */
    sidebar(): SidebarButton {
        const actions = this.editor?.editorNode?.querySelectorAll(Actions.TAG)
        let content = ''
        if (actions) {
            actions.forEach(action => {
                const todo = this.getAttribute('todo', action)
                const owners = this.getAttribute('owners', action)
                const due = this.getAttribute('due', action)
                let dueDate = ''
                if (due) {
                    dueDate += `,<br/>Due: ${due}`
                }
                content += `
                    <article class="action">
                        <a href="#${action.id}">${todo}</a>
                        <p>Owned by: ${owners}${dueDate}</p>
                    </article>`
            })
        }
        return new SidebarButton(Icons.action, 'actions', content)
    }

}
