
import recipe_database from './recipe_database/recipe_database.json' assert {type: 'json'};

console.log(recipe_database.all_recipes[0].name);
console.log(recipe_database.all_recipes[0].url);

console.log(recipe_database.all_recipes[1].name);
console.log(recipe_database.all_recipes[1].url);

function getTotalRecipes(){
    var total_serv = document.getElementById("total-serv").value;
    var serv_per_recipe = document.getElementById("serv-per-recipe").value;
    document.getElementById('total-recipe').innerHTML = Math.ceil(total_serv / serv_per_recipe).toString();
}
document.querySelector('#total-serv').addEventListener('change', getTotalRecipes);
document.querySelector('#serv-per-recipe').addEventListener('change', getTotalRecipes);

function getTextAreaList(ta_id){
    var ta_str = document.getElementById(ta_id).value;
    ta_str = ta_str.replaceAll(", ", ",");
    var ta_list = ta_str.split(",");
    for (let i = 0; i < ta_list.length; i++) {
        ta_list[i] = ta_list[i].toLowerCase();
    }
    return ta_list;
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
            for (let i = 0; i < item_words.length; i++) {
                if (unwant_itms.includes(item_words[i])) {
                    return false;
                }
            }
        }
    }
    return true;
}

function pickRecipes(){
    var req_itms = getTextAreaList("req-itms");
    var unwant_itms = getTextAreaList("unwant-itms");
    var total_serv = document.getElementById("total-serv").value;
    var serv_per_recipe = document.getElementById("serv-per-recipe").value;
    var total_recipe = Math.ceil(total_serv / serv_per_recipe);

    var recipe_valid = [];
    var recipe_valid_idxs = [];
    for (let i = 0; i < recipe_database.all_recipes.length; i++) {
        var is_valid_recipe = isValidRecipe(i, unwant_itms);
        recipe_valid.push(is_valid_recipe);
        if (is_valid_recipe) {
            recipe_valid_idxs.push(i);
        }
    }

    var best_combo = [];
    var combo_iters = 0;
    while (combo_iters < 1000) {
        var rand_idxs = [];
        while (rand_idxs.length < total_recipe) {
            var rand_idx = Math.floor(Math.random() * recipe_valid_idxs.length)
            if (!rand_idxs.includes(rand_idx)) {
                rand_idxs.push(rand_idx);
            }
        }
        best_combo = rand_idxs
        combo_iters++;
    }

    console.log(best_combo.toString());
    document.getElementById('test').innerHTML = best_combo.toString();
}
document.querySelector('#generate').addEventListener('click', pickRecipes);

export { getTotalRecipes, pickRecipes }