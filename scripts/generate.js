
import recipe_database from './recipe_database/recipe_database.json' assert {type: 'json'};
console.log("Total Recipes Loaded: " + recipe_database.all_recipes.length.toString())

function getTotalRecipes(){
    var total_serv = document.getElementById("total-serv").value;
    var serv_per_recipe = document.getElementById("serv-per-recipe").value;
    document.getElementById('total-recipe').innerHTML = Math.ceil(total_serv / serv_per_recipe).toString();
}
document.querySelector('#total-serv').addEventListener('change', getTotalRecipes);
document.querySelector('#serv-per-recipe').addEventListener('change', getTotalRecipes);

function getTextAreaArray(ta_id){
    var ta_str = document.getElementById(ta_id).value;
    ta_str = ta_str.replaceAll(", ", ",");
    var ta_arr = ta_str.split(",");
    for (let i = 0; i < ta_arr.length; i++) {
        ta_arr[i] = ta_arr[i].toLowerCase();
    }
    if (ta_arr.includes("")) {
        ta_arr = []
    }
    return ta_arr;
}

function isValidRecipe(recipe_idx, unwant_itms){
    var recipe_name = recipe_database.all_recipes[recipe_idx].name;
    var recipe_df = recipe_database.all_recipes[recipe_idx].recipe;

    if (recipe_df.length == 0) {
        return false;
    }
    else if (unwant_itms.length != 0) {
        var recipe_name_words = recipe_name.toLowerCase().split(" ");
        for (let i = 0; i < recipe_name_words.length; i++) {
            if (unwant_itms.includes(recipe_name_words[i])) {
                return false;
            }
        }

        for (let i = 0; i < recipe_df.length; i++) {
            var recipe_item = recipe_df[i].item.toLowerCase();
            if (unwant_itms.includes(recipe_item)) {
                return false;
            }

            var item_words = recipe_item.split(" ");
            for (let j = 0; j < item_words.length; j++) {
                if (unwant_itms.includes(item_words[j])) {
                    return false;
                }
            }
        }
    }
    return true;
}

function isValidRecipeCombo(recipe_combo_idxs, req_itms) {
    if (req_itms.length != 0) {
        var has_req_itms = new Array(req_itms.length).fill(false);

        for (let i = 0; i < recipe_combo_idxs; i++) {
            var recipe_df = recipe_database.all_recipes[recipe_combo_idxs[i]].recipe;
            for (let j = 0; j < recipe_df.length; j++) {
                var recipe_item = recipe_df[j].item.toLowerCase();
                var req_itms_idx = req_itms.indexOf(recipe_item);
                if (req_itms_idx != -1) {
                    has_req_itms[req_itms_idx] = true;
                }
            }
        }

        return !has_req_itms.includes(false);
    }
    return true;
}

function pickRecipes(){
    var req_itms = getTextAreaArray("req-itms");
    var unwant_itms = getTextAreaArray("unwant-itms");
    var total_serv = document.getElementById("total-serv").value;
    var serv_per_recipe = document.getElementById("serv-per-recipe").value;
    var total_recipe = Math.ceil(total_serv / serv_per_recipe);

    console.log("[" + req_itms.toString() + "] Length: " + req_itms.length.toString());
    console.log("[" + unwant_itms.toString() + "] Length: " + unwant_itms.length.toString());

    var recipe_valid_idxs = [];
    for (let i = 0; i < recipe_database.all_recipes.length; i++) {
        if (isValidRecipe(i, unwant_itms)) {
            recipe_valid_idxs.push(i);
        }
    }
    console.log("Total Valid Recipes: " + recipe_valid_idxs.length.toString());

    var combo_iters = 0;
    var max_tries = 1000000;
    var recipe_combo_idxs = [];
    while (combo_iters < max_tries) {
        recipe_combo_idxs = [];
        while (recipe_combo_idxs.length < total_recipe) {
            var rand_idx = recipe_valid_idxs[Math.floor(Math.random() * recipe_valid_idxs.length)];
            if (!recipe_combo_idxs.includes(rand_idx)) {
                recipe_combo_idxs.push(rand_idx);
            }
        }

        if (isValidRecipeCombo(recipe_combo_idxs, req_itms)) {
            console.log("Trying to break");
            break;
        }
        combo_iters++;
    }
    if (combo_iters >= max_tries) {
        console.log("Recipe Generation Failed: No Combos Found after " + max_tries.toString() + " tries")
    }

    var to_return = "";
    for (let i = 0; i < recipe_combo_idxs.length; i++) {
        to_return += "<div><a target=\"_blank\" rel=\"noopener noreferrer\" href=\"" + recipe_database.all_recipes[recipe_combo_idxs[i]].url + "\">" + recipe_database.all_recipes[recipe_combo_idxs[i]].name + "</a></div>";
    }

    document.getElementById('test').innerHTML = to_return;
}
document.querySelector('#generate').addEventListener('click', pickRecipes);

export { getTotalRecipes, pickRecipes }