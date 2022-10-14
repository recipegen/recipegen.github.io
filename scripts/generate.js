
import recipe_database from './recipe_database/recipe_database.json' assert {type: 'json'};

console.log(recipe_database.all_recipes[0].name)
console.log(recipe_database.all_recipes[0].url)

console.log(recipe_database.all_recipes[1].name)
console.log(recipe_database.all_recipes[1].url)

function getTotalRecipes(){
    var total_serv = document.getElementById("total-serv").value;
    var serv_per_recipe = document.getElementById("serv-per-recipe").value;
    document.getElementById('total-recipe').innerHTML = Math.ceil(total_serv / serv_per_recipe).toString();
}
document.querySelector('#total-serv').addEventListener('change', getTotalRecipes)
document.querySelector('#serv-per-recipe').addEventListener('change', getTotalRecipes)

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
    return_text += "<div>" + recipe_database.all_recipes[0].name + "</div>"
    return_text += "<div>" + recipe_database.all_recipes[0].url + "</div>"
    document.getElementById('test').innerHTML = return_text
}
document.querySelector('#generate').addEventListener('click', pickRecipes)

export { readAllRecipes, getTotalRecipes }