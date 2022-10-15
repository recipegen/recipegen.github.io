import sys
import json
import time
import recipe
import pandas as pd
from tqdm import tqdm
import hello_fresh as hf
from multiprocessing import Pool, Lock

__recipe_database_filename = 'recipe_database.json'
__itm_cat_map_filename = 'item_category_mapping.json'

def __verbose_print(to_print, verbose):
    if verbose:
        print(to_print)

def __parse_all_recipes_helper_hf(url):
    to_return = None
    try:
        to_return = hf.get_recipe(url)
    except recipe.RecipeParseException:
        pass
    return to_return

def __parse_all_recipes(verbose=True):
    all_recipes = []
    all_urls_hf = hf.find_recipe_urls(verbose=verbose)
    __verbose_print('Parsing Hello Fresh Recipes', verbose)

    start_time = time.time()
    pool = Pool(8)
    return_recipes = pool.map(__parse_all_recipes_helper_hf, all_urls_hf)
    pool.close()
    end_time = time.time()
    return_recipes = [recipe for recipe in return_recipes if recipe is not None]
    __verbose_print('Parsed ' + str(len(return_recipes)) + ' recipes from Hello Fresh', verbose)
    __verbose_print('Elapsed Time: ' + str(end_time-start_time) + '\tTime per Iteration: ' + str((end_time-start_time)/len(all_urls_hf)), verbose)
    all_recipes.extend(return_recipes)

    return all_recipes

def __save_all_recipes(all_recipes=None, verbose=True):
    if all_recipes is None:
        all_recipes = __parse_all_recipes(verbose=verbose)
    all_recipes_dict = {'all_recipes': [recipe_obj.get_recipe_dict() for recipe_obj in all_recipes]}

    with open(__recipe_database_filename, 'w') as output_file:
        json.dump(all_recipes_dict, output_file)

def __dict_clean(items):
    result = {}
    for key, value in items:
        if value is None:
            value = ''
        elif value != value:
            value = ''
        result[key] = value
    return result

def __read_all_recipes():
    all_recipes_dict = []
    with open(__recipe_database_filename, 'r') as input_file:
        all_recipes_dict = json.loads(input_file.read(), object_pairs_hook=__dict_clean)

    all_recipes = [recipe.Recipe(recipe_dict=recipe_dict) for recipe_dict in all_recipes_dict['all_recipes']]
    return all_recipes

def __save_itm_cat_map(itm_cat_map):
    with open(__itm_cat_map_filename, 'w') as output_file:
        json.dump(itm_cat_map, output_file)

def __read_itm_cat_map():
    itm_cat_map = {}
    with open(__itm_cat_map_filename, 'r') as input_file:
        itm_cat_map = json.loads(input_file.read(), object_pairs_hook=__dict_clean)

    return itm_cat_map

def __get_new_itm_cat(all_recipes, itm_cat_map):
    for r in all_recipes:
        recipe_df = r.get_recipe_df()
        for idx, row in recipe_df.iterrows():
            if row['item'].lower() not in itm_cat_map.keys():
                new_cat = input('Enter Category for \"' + row['item'] + '\":\t')
                new_cat = new_cat[0].upper() + new_cat[1:]
                itm_cat_map[row['item'].lower()] = new_cat
    return itm_cat_map

if __name__ == "__main__":
    if sys.argv[1] == "save":
        __save_all_recipes(verbose=True)
    elif sys.argv[1] == "clean":
        all_recipes = __read_all_recipes()
        __save_all_recipes(all_recipes=all_recipes)
    elif sys.argv[1] == "cat":
        all_recipes = __read_all_recipes()
        itm_cat_map = __read_itm_cat_map()
        itm_cat_map = __get_new_itm_cat(all_recipes[:1], itm_cat_map)
        __save_itm_cat_map(itm_cat_map)

