
recipe_database_filename = 'recipe_database/recipe_database.json'

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
}

function readAllRecipes(){
    recipe_dict_list = readTextFile(recipe_database_filename, function(text){
        var data = JSON.parse(text);
        console.log(data[0]);
    });
}

function getTotalRecipes(){
    var total_serv = document.getElementById("total-serv").value;
    var serv_per_recipe = document.getElementById("serv-per-recipe").value;
    document.getElementById('total-recipe').innerHTML = Math.ceil(total_serv / serv_per_recipe).toString()
}

function getTextAreaList(ta_id){
    var ta_str = document.getElementById(ta_id).value;
    ta_str = ta_str.replaceAll(", ", ",")
    var ta_list = ta_str.split(",")
    return ta_list
}

function pickRecipes(){
    var req_itms = getTextAreaList("req-itms")
    var unwant_itms = getTextAreaList("unwant-itms")
    var total_serv = document.getElementById("total-serv").value;
    var serv_per_recipe = document.getElementById("serv-per-recipe").value;

    return_text = "<div>" + total_serv.toString() + "</div>"
    return_text += "<div>" + serv_per_recipe.toString() + "</div><div>"
    for (let i = 0; i < req_itms.length; i++) {
        return_text += req_itms[i] + "|^";
    }
    return_text = return_text.substring(0, return_text.length - 2) + "</div><div>"
    for (let i = 0; i < unwant_itms.length; i++) {
        return_text += unwant_itms[i] + "|^";
    }
    return_text = return_text.substring(0, return_text.length - 2) + "</div>"
    document.getElementById('test').innerHTML = return_text
}