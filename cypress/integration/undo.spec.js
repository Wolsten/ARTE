
describe('Tests undo and redo', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    after('Screenshot', function(){
        cy.screenshot()
    })

    it('tests undo', function(){

        cy.arte_print('This is a first level heading A')
        cy.arte_click_id('H1')

        cy.arte_print('This is a second level heading B')
        cy.arte_click_id('H2')

        cy.arte_print('This is a third level heading C')
        cy.arte_click_id('H3')

        cy.arte_print('{enter}This is a paragraph')
    })
})