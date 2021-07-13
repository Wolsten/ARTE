# README.md

## Introduction

AJE stands for "Another Javascript Editor" and is pronounced "Ajay".

It provides a limited set of WYSYWIG controls for formatting text like normal word processors.

It uses a contenteditable approach but none of the standard functions for formatting text. Instead, all formatting is done at a low level using the regular dom manipulation functions.

Importantly, AJE supports custom plugins, which allows you to add just about any functionality you like.

AJE is written in ES6 but the build process using Babel and Webpack potentially opens up usage on a wide range of browsers.

*Disclaimer*

AJE is not a production ready app and has not been tested extensively across a range of browsers. It is licenced under MIT and therefore normal caveats apply.

## Usage

To use as is just download the following source file:

`
/public/js/AJE.js
`

To build your own version of AJE you can use Babel and Webpack as configured in the source here. Alternatively, feel free to use your own build tools based on the source files provided.

## Todos

* Filter keys triggering buffering - done 13/7/21
* Confirm the Helpers.isCustom methiod is correctly defeind

## Acknowledgements

I set up my initial build environment setup using these instructions:

https://www.sitepoint.com/es6-babel-webpack/

I ran into issues with use of an older Babel version so updated to latest for webpack from here:

https://babeljs.io/setup#installation

AJE uses a small number of SVG icons sourced from the Bootstrap Icon library here:

https://icons.getbootstrap.com

