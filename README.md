# fCM-js
*Modeling Tool with Design-Time Support for Fragment-Based Case Management.*
### ***[:rocket: Try it live! :rocket:](https://bpt-lab.org/fcm-js/)***


fcm-js is a modeling tool for fragment-based case management. It aims at supporting users at design time by providing a joint, visual user interface for all artifacts and by integrating automated guideline checking based on fCM guidelines. 

The catalog of fCM guidelines is also available in this repository in [the wiki](../../wiki).

## User Guide
### Installation
Node needs to be installed for the modeler to run.

To install the modeler, clone this repository on your machine. To start, navigate to the installation folder and enter the following into your command line:
```shell
npm install
npm run build
npm run serve
```

The modeler is then served to `http://localhost:9005`.

When developing, the following can be run to automatically re-bundle on changes:
```shell
npm run dev
```

### Usage
There are a [demo video](https://www.youtube.com/watch?v=bIDZUYBNms0) and a [use case tutorial](/.docs/Tutorial.md) to showcase how to use fcm-js.

## Developer Guide
### Structure Overview
The repository is structured as follows: 
* [/app](app) contains the actual application files.
    * For changes of the overall UI: The web page `.js` and `.html` files can be found in its root, and most general style files under [/styles](app/styles).
    * The actual logic is then contained in the [/lib](app/lib) folder
        * [/datamodelmodeler](app/lib/datamodelmodeler), [/dependencymodeler](app/lib/dependencymodeler), [/fragmentmodeler](app/lib/fragmentmodeler), [/objectivemodeler](app/lib/objectivemodeler), [/terminationconditionmodeler](app/lib/terminationconditionmodeler), [/olcmodeler](app/lib/olcmodeler), [/rolemodeler](app/lib/rolemodeler) and [/resourcemodeler](app/lib/resourcemodeler) include the resources of the respective modelers. These build heavily on [diagram-js](https://github.com/bpmn-io/diagram-js), [bpmn-js](https://github.com/bpmn-io/bpmn-js), and [object diagram modeler](https://github.com/timKraeuter/object-diagram-modeler/tree/master/modeler), please refer to the documentations of those three to understand how they work. Common modules between the modelers can be found in [/common](app/lib/common), however, duplication might still exist.
        * [/mediator](app/lib/mediator) includes the central component that controls the communication between and access to the single modelers. For each modeler, this [Mediator](app/lib/mediator/Mediator.js) contains one so called "hook", which wraps and allows access  to the respective modeler.
        * [/guidelines](app/lib/guidelines) includes all relevant code for guidelines. The list of guidelines is defined in [Guidelines.js](app/lib/guidelines/Guidelines.js).
* [/resources](resources) contains auxiliary example and default files.

### Branch Naming

Branch names have the following structure: `<type>/<issue-number>-<issue-name>`

- `<type>` gets replaced with feature or fix, depending on the type of changes introduced by the branch 

- `<issue-number>` gets replaced with the number of the issue the branch aims to close 

- `<issue-name>` gets replaced with the name of the issue the branch aims to close, or a shortened form of it 

Experimental branches may use the structure `experimental/<anything>`


### Guideline Interface
The guidelines are integrated via a unified interface. They can be found in [app/lib/guidelines](app/lib/guidelines). Here the actual guidelines are implemented in [Guidelines.js](app/lib/guidelines/Guidelines.js) while the checking component is located in [Checker.js](app/lib/guidelines/Checker.js). Every guideline consists of the following components:

- `title`: The title of the guideline which shortly summarizes what the guideline is about.
- `id`: The id of the guideline which must be a unique identifier.
- `getViolations(mediator) {}`: A function which returns an array of elements. The mediator parameter allows access to the respective modelers via its hooks (see above).
- `severity`: Can be one of the following: Errors | Warnings | Information and indicates the color the element is highlighted in.
- `link`: A link to the guideline in the [guideline catalog](https://github.com/bptlab/fCM-design-support/wiki/Guidelines). 

For every returned element in the getViolations() function the follwing must be returned:
- `element`: The .businessobject of the element the violation should be displayed on.
- `message`: The error message which is displayed in the error table and the hints.
- `quickFixes[]`: An array of potential quickfixes for the violation.
    -   `label`: The message which is displayed on the quickfix button.
    -   `action`: The actual action which is performed when the button is clicked.

A new guideline can therefore be implemented by adding the code in the described format in the `export default` array in the [Guidelines.js](app/lib/guidelines/Guidelines.js) file. 

## License

[MIT](LICENSE)

Contains parts of [bpmn-io](https://github.com/bpmn-io) released under the [bpmn.io license](http://bpmn.io/license), and [diagram-js](https://github.com/bpmn-io/diagram-js) and [object diagram modeler](https://github.com/timKraeuter/object-diagram-modeler/tree/master/modeler) released under the MIT license.
