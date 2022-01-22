export function meaningful_state_lables(state) {
    const labels = ["done","ready","known","in progress","got","thought","gone","made","taken","come","said","put","wanted","given"];
    
    // check if state label violates guideline
    if (labels.includes(state.name)) {
        // check if error is already listed
        var regularExp = state.id;
        
        var errorEntries = document.getElementsByClassName("errorEntry");
        
        for (let i=0; i < errorEntries.length; i++) {
                if (errorEntries[i].innerHTML.match(regularExp)) {
                    var errorBar = document.getElementById("errorBar");
                    
                    // reduce count -1
                    var errorCountString = errorBar.children[0].children[0].innerHTML;

                    var regularExpCount = /\d+/;
                    var errorCount = parseInt(errorCountString.match(regularExpCount)[0]);

                    errorCount += -1;

                    errorBar.children[0].children[0].innerHTML = "Errors: " + errorCount;

                    //remove error Entry
                    errorEntries[i].parentNode.removeChild( errorEntries[i])    
                } 
            } 
    } else {
        
        // check if error is already listed
        var regularExp = state.id;
        
        var errorEntries = document.getElementsByClassName("errorEntry");
        
        if (errorEntries.length == 0) {
            var errorBar = document.getElementById("errorBar");

            var errorCountString = errorBar.children[0].children[0].innerHTML;

            var regularExpCount = /\d+/;
            var errorCount = parseInt(errorCountString.match(regularExpCount)[0]);

            errorCount += 1;

            errorBar.children[0].children[0].innerHTML = "Errors: " + errorCount;

            var errorEntry = document.createElement("div");
            errorEntry.classList.add("errorEntry");
            var errorContent = document.createTextNode("Label of " + state.id + " with name: " + state.name + " has no meaningful state label");
            errorEntry.appendChild(errorContent);

            errorBar.appendChild(errorEntry); 
        } else {
            
            var append = false;
            
            for (let i=0; i < errorEntries.length; i++) {
                if (errorEntries[i].innerHTML.match(regularExp)) {
                    var errorBar = document.getElementById("errorBar");

                    //remove error Entry
                    
                    errorEntries[i].parentNode.removeChild( errorEntries[i])
                    
                    // Add new
                    var errorEntry = document.createElement("div");
                    errorEntry.classList.add("errorEntry");
                    var errorContent = document.createTextNode("Label of " + state.id + " with name: " + state.name + " has no meaningful state label");
                    errorEntry.appendChild(errorContent);

                    errorBar.appendChild(errorEntry); 
                    append = true;
    
                } 
            } 
            if (!append) {      
                    var errorBar = document.getElementById("errorBar");

                    var errorCountString = errorBar.children[0].children[0].innerHTML;

                    var regularExpCount = /\d+/;
                    var errorCount = parseInt(errorCountString.match(regularExpCount)[0]);

                    errorCount += 1;

                    errorBar.children[0].children[0].innerHTML = "Errors: " + errorCount;

                    var errorEntry = document.createElement("div");
                    errorEntry.classList.add("errorEntry");
                    var errorContent = document.createTextNode("Label of " + state.id + " with name: " + state.name + " has no meaningful state label");
                    errorEntry.appendChild(errorContent);

                    errorBar.appendChild(errorEntry); 
                }
        }
    }
}