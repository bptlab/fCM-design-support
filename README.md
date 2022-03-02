# fCM-design-support
Modeling Tool with Design-Time Support for Fragment-Based Case Management

## Installation & Usage
Node needs to be installed for the modeler to run.

To install the modeler, clone this repository on your machine. To start, navigate to the installation folder and enter the following into your command line:
```shell
npm install
npm run build
npm run serve
```

The modeler is then served to `http://localhost:9024`.

When developing, the following can be run to automatically re-bundle on changes:
```shell
npm run dev
```

## Guidelines
The guidelines are integrated via a unified interface. They can be found in *app/lib/guidelines*. In here the actual guidelines are implemented in *Guidelines.js* while the checking component is located in *Checker.js*. Every guideline consists of the following components:

- title: the title of the guideline - shortly summerizes what the guideline is about.
- id: the id of the guideline - must be a unique identifier.
- getViolations(mediator) {} - a function which returns an array of elements.
    - for every returned element the follwing must be returned:
    - element: - the .businessobject of the element the violation should be displayed on.
    - message: the error message which is displayed in the error table and the hints.
    - quickFixes: an array of potential quickfixes for the violation
        -   label: the message which is displayed in the quickfix button
        -   action: the actual action which is performed when the button is clicked
- severity: Errors | Warnings | Information - indicates the color the element is highlighted in.
- link: A link to the guideline. 

A new guideline can therefore be implemented by adding the code in the described format in the *export default* array in the *Guidelines.js* file. 