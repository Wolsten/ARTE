describe('Tests cut, copy and paste', function () {

    //
    // Shortcut {cmd} not working as documented therefore cannot test
    // {meta}x cuts but inserts the x
    // {meta}v doesn't paste but inserts the v (this may be a permissions issue)
    // Likely to have the same result when using the clipboard API
    //

    beforeEach('Open editor url and start editing', function(){
        cy.arte_visit()
    })


    it('1. tests cutting and pasting with shortcut key', function(){

        cy.arte_type_format('h1','Testing cutting with cmd-x',true)

        cy.arte_print('This is a paragraph with some text in it.')

        cy.arte_set_selection('paragraph')
        cy.arte_type('{meta}x')
        cy.get('p').contains('paragraph').should('not.exist')

        // Paste in the cut text at end of the line
        cy.arte_type('{movetoend} {meta}V')

    })

})