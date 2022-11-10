
import recipe_database from './recipe_database/recipe_database.json' assert {type: 'json'};
console.log("Total Recipes Loaded: " + recipe_database.all_recipes.length.toString())

import itm_cat_map from './recipe_database/item_category_mapping.json' assert {type: 'json'};
console.log("Total Items Mapped: " + Object.keys(itm_cat_map).length.toString())

const itm_cats = ["Produce", "Meat", "Seafood", "Bakery", "Dairy", "Frozen", "Grains", "Canned Goods", "Dry Goods", "Snacks", "Sauces", "Oils", "Spices", "Beverages", "Other"]

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
        for (let i = 0; i < recipe_combo_idxs.length; i++) {
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

function genGroceryList(recipe_combo_idxs) {
    var grocery_list_df = [];
    for (let i = 0; i < recipe_combo_idxs.length; i++) {
        var recipe_df = recipe_database.all_recipes[recipe_combo_idxs[i]].recipe;
        for (let j = 0; j < recipe_df.length; j++) {
            grocery_list_df.push(recipe_df[j])
        }
    }

    grocery_list_df.sort(function(first, second) {
        return first.item.localeCompare(second.item);
    });

    var new_grocery_list_df = [];
    for (let i = 0; i < grocery_list_df.length; i++) {
        var found_agg = false;
        for (let j = 0; j < new_grocery_list_df.length; j++) {
            if (grocery_list_df[i].item.localeCompare(new_grocery_list_df[j].item) == 0 && grocery_list_df[i].unit.localeCompare(new_grocery_list_df[j].unit) == 0) {
                new_grocery_list_df[j].qty += grocery_list_df[i].qty;
                found_agg = true;
            }
        }
        if (!found_agg) {
            new_grocery_list_df.push(grocery_list_df[i]);
        }
    }

    var cat_grocery_list_df = [];
    for (let i = 0; i < new_grocery_list_df.length; i++) {
        var new_row = {cat: "", 
                    item: new_grocery_list_df[i].item,
                    unit: new_grocery_list_df[i].unit,
                    qty: new_grocery_list_df[i].qty};
        if (new_grocery_list_df[i].item.toLowerCase() in itm_cat_map) {
            new_row.cat = itm_cat_map[new_grocery_list_df[i].item.toLowerCase()];
        }
        cat_grocery_list_df.push(new_row);
    }

    cat_grocery_list_df.sort(function(first, second) {
        return itm_cats.indexOf(first.cat) - itm_cats.indexOf(second.cat);
    });

    return cat_grocery_list_df;
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
            break;
        }
        combo_iters++;
    }

    if (combo_iters >= max_tries) {
        console.log("Recipe Generation Failed: No Combos Found after " + max_tries.toString() + " tries");
    }
    else { 
        console.log("Recipe Generation Success: Combo Found after " + combo_iters.toString() + " tries");

        var grocery_list_df = genGroceryList(recipe_combo_idxs);

        var output_html = "<label>Generated Recipes</label>";
        for (let i = 0; i < recipe_combo_idxs.length; i++) {
            output_html += "<div><a target=\"_blank\" rel=\"noopener noreferrer\" href=\"" + recipe_database.all_recipes[recipe_combo_idxs[i]].url + "\">" + recipe_database.all_recipes[recipe_combo_idxs[i]].name + "</a></div>";
        }
        document.getElementById('output-recipe').innerHTML = output_html;

        output_html = "<label>Grocery List</label><table id=\"grocery-list-table\"><tr><th></th><th>Category</th><th>Item</th><th>Unit</th><th>Quantity</th></tr>";
        for (let i = 0; i < grocery_list_df.length; i++) {
            output_html += "<tr><td><input type=\"checkbox\" id=\"grocery-list-checkbox-" + i.toString() + "\"></td><td>" + grocery_list_df[i].cat + "</td><td>" + grocery_list_df[i].item + "</td><td>" + grocery_list_df[i].unit + "</td><td>" + grocery_list_df[i].qty + "</td></tr>";
        }
        document.getElementById('output-grocery').innerHTML = output_html + "</table>";

        var grocery_list_checkbox_elements = document.querySelectorAll('[id^="grocery-list-checkbox"]');
        for (let i = 0; i < grocery_list_checkbox_elements.length; i++) {
            grocery_list_checkbox_elements[i].addEventListener('change', removeCheckRow)
        }
    }
}
document.querySelector('#generate').addEventListener('click', pickRecipes);

function replaceHTML(input, pattern, replacement) {
    while (input.indexOf(pattern) != -1) {
        input = input.substring(0, input.indexOf(pattern)) + replacement + input.substring(input.indexOf(pattern) + pattern.length);
    }
    return input;
}

function searchHTML(input, search_start, search_end) {
    input = input.substring(input.indexOf(search_start) + search_start.length);
    return input.substring(0, input.indexOf(search_end));
}

function removeCheckRow(){
    console.log("Trying to remove this checkbox row");

    var gl_html = document.getElementById('grocery-list-table').innerHTML;
    gl_html = replaceHTML(gl_html, "<tbody>", "")
    gl_html = replaceHTML(gl_html, "</tbody>", "")
    gl_html = replaceHTML(gl_html, "<tr>", "")
    var gl_rows = gl_html.split("</tr>").slice(0, -1);
    console.log(gl_rows);

    var gl_ids = [];
    for (let i = 1; i < gl_rows.length; i++) {
        gl_ids.push(searchHTML(gl_rows[i], "<input type=\"checkbox\" id=\"", "\">"))
    }
    console.log(gl_ids);

    for (let i = gl_ids.length - 1; i >= 0; i--) {
        if (document.getElementById(gl_ids[i]).checked) {
            console.log(gl_ids[i]);
            console.log(gl_rows[i]);

            gl_rows.splice(i+1, 1)
        }
    }
    console.log(gl_rows)
}

export { getTotalRecipes, pickRecipes }