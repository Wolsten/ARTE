
describe('Tests block formatting', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
        cy.arte_edit()
    })

    it('tests block formatting', function(){

        cy.arte_type('This is a first level heading A')
        cy.arte_click_id('H1')

        cy.arte_type('{enter}This is a second level heading B')
        cy.arte_click_id('H2')

        cy.arte_type('{enter}This is a third level heading C')
        cy.arte_click_id('H3')

        cy.arte_type('{enter}{enter}This is a paragraph')

        cy.arte_type('{enter}This is a block quote')
        cy.arte_click_id('BLOCKQUOTE')
    })
})