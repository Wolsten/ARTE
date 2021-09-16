
describe('Tests block formatting', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    it('1. tests block formatting', function(){
        cy.arte_type_format('h1','This is a first level heading A',true)
        cy.arte_print_format('h2','This is a second level heading B',true)
        cy.arte_print_format('h3','This is a third level heading C',true)
        cy.arte_print('This is a third level heading C')
        cy.arte_print_format('blockquote','This is a block quote')
    })
})