// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('upload_file', (fileName, fileType = ' ', selector, submit=false) => {
    return cy.get(selector).then(subject => {
        
      cy.fixture(fileName, 'base64')

        .then(Cypress.Blob.base64StringToBlob)

        .then(blob => {

          const el = subject[0];
          const testFile = new File([blob], fileName, { type: fileType });
          const dataTransfer = new DataTransfer();

          dataTransfer.items.add(testFile);

          el.files = dataTransfer.files;

          if ( submit ){
            el.closest('form').submit();
          }
        });
    });
  });

  Cypress.Commands.add('arte_open', ()=> {
    cy.visit('http://localhost:5501/index.html')
  })

  Cypress.Commands.add('arte_edit', ()=> {
    cy.get('.editor-body').click()
  })

  Cypress.Commands.add('arte_type', txt => {
    cy.get('.editor-body').type(txt)
  })
