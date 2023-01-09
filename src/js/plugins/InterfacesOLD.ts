export interface EditButton {
    label: string
    callback: Function
}

export interface EditButtons {
    cancel: EditButton
    confirm: EditButton
    delete?: EditButton
}