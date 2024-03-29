import os
import sys
import json
import time
import recipe
import pandas as pd
from tqdm import tqdm
from multiprocessing import Pool, Lock

import home_chef as hc
import hello_fresh as hf

__recipe_database_filename = 'recipe_database.json'
__itm_cat_map_filename = 'item_category_mapping.json'

itm_cats = ["Produce", "Meat", "Seafood", "Bakery", "Dairy", "Frozen", "Grains", "Canned Goods", "Dry Goods", "Snacks", "Sauces", "Oils", "Spices", "Beverages", "Other"]

def __verbose_print(to_print, verbose):
    if verbose:
        print(to_print)

def __parse_all_recipes_helper_hc(url):
    to_return = None
    try:
        to_return = hc.get_recipe(url)
    except recipe.RecipeParseException:
        pass
    return to_return
        
def __parse_all_recipes_helper_hf(url):
    to_return = None
    try:
        to_return = hf.get_recipe(url)
    except recipe.RecipeParseException:
        pass
    return to_return

def __parse_all_recipes(verbose=True):
    all_recipes = []
    
    # Home Chef
    __verbose_print('Finding Home Chef Recipes', verbose)
    all_urls_hc = hc.find_recipe_urls(verbose=verbose)
    __verbose_print('Parsing Home Chef Recipes', verbose)
    start_time = time.time()
    pool = Pool(8)
    return_recipes = pool.map(__parse_all_recipes_helper_hc, all_urls_hc)
    pool.close()
    end_time = time.time()
    return_recipes = [recipe for recipe in return_recipes if recipe is not None]
    __verbose_print('Parsed ' + str(len(return_recipes)) + ' recipes from Home Chef', verbose)
    __verbose_print('Elapsed Time: ' + str(round(end_time-start_time,2)) + '\tIterations/Sec: ' + str(round(len(all_urls_hc)/(end_time-start_time),2)), verbose)
    all_recipes.extend(return_recipes)
    
    # Hello Fresh
    __verbose_print('Finding Hello Fresh Recipes', verbose)
    all_urls_hf = hf.find_recipe_urls(verbose=verbose)
    __verbose_print('Parsing Hello Fresh Recipes', verbose)
    start_time = time.time()
    pool = Pool(8)
    return_recipes = pool.map(__parse_all_recipes_helper_hf, all_urls_hf)
    pool.close()
    end_time = time.time()
    return_recipes = [recipe for recipe in return_recipes if recipe is not None]
    __verbose_print('Parsed ' + str(len(return_recipes)) + ' recipes from Hello Fresh', verbose)
    __verbose_print('Elapsed Time: ' + str(round(end_time-start_time,2)) + '\tIterations/Sec: ' + str(round(len(all_urls_hf)/(end_time-start_time),2)), verbose)
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

def __get_cat_input(item, iter, tot_iter):
    os.system('cls')
    print('Recipe [' + str(iter) + '/' + str(tot_iter) + ']\n')
    for i in range(len(itm_cats)):
        print(str(i) + '\t' + itm_cats[i])
    print('')
    new_cat = input('Enter Cat Num for \"' + item + '\":\t')
    return itm_cats[int(new_cat)]

def __get_new_itm_cat(all_recipes, itm_cat_map):
    try:
        count = 1
        for r in all_recipes:
            recipe_df = r.get_recipe_df()
            for idx, row in recipe_df.iterrows():
                if row['item'].lower() not in itm_cat_map.keys():
                    itm_cat_map[row['item'].lower()] = __get_cat_input(row['item'], count, len(all_recipes))
            count += 1
    except KeyboardInterrupt as e:
        pass
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
        itm_cat_map = __get_new_itm_cat(all_recipes, itm_cat_map)
        __save_itm_cat_map(itm_cat_map)

