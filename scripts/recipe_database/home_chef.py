import re
import recipe
import requests
import unicodedata
import pandas as pd
from bs4 import BeautifulSoup

__base_url = 'https://www.homechef.com'

def __verbose_print(to_print, verbose):
    if verbose:
        print(to_print)

##### SECTION 1:  Finding all recipe links #####

def __get_all_links(soup, base_url):
    links = []
    for x in soup.find_all('a', href=True):
        if '/recipes' in x['href']:
            links.append(x['href'].replace(base_url, ''))
        elif '/meals/' in x['href']:
            links.append(x['href'].replace(base_url, ''))
    return links

def __filter_links(links):
    other_links = []
    recipe_links = []
    for link in links:
        if '/meals/' in link:
            recipe_links.append(link)
        else:
            other_links.append(link)
    return recipe_links, other_links

def find_recipe_urls(verbose=False):
    prev_extensions = []
    search_extensions = ['/recipes']
    recipe_extensions = []
    
    while len(search_extensions) > 0:
        curr_search_extension = search_extensions.pop(0)
        __verbose_print(str(len(search_extensions)) + '\t' + curr_search_extension, verbose)
        prev_extensions.append(curr_search_extension)
    
        search_url = __base_url + curr_search_extension
        search_page = requests.get(search_url)
        search_soup = BeautifulSoup(search_page.content, "html.parser")
        search_links = __get_all_links(search_soup, __base_url)
        
        recipe_links, other_links = __filter_links(search_links)
        
        recipe_extensions.extend(recipe_links)
        for link in other_links:
            if link not in prev_extensions and link not in search_extensions:
                search_extensions.append(link)

    to_return = list(set(recipe_extensions))
    __verbose_print('Found ' + str(len(to_return)) + ' recipes from Home Chef', verbose)
    for i in range(len(to_return)):
        to_return[i] = __base_url + to_return[i]
    return to_return

##### SECTION 2:  Parsing recipe links to recipe objects #####

def __get_recipe_soup(url):
    recipe_page = requests.get(url)
    recipe_soup = BeautifulSoup(recipe_page.content, "html.parser")

    return recipe_soup

def __parse_numeric(num_str):
    try:
        return float(num_str)
    except:
        if len(num_str) == 1:
            return unicodedata.numeric(num_str)
        else:
            return float(num_str[:-1]) + unicodedata.numeric(num_str[-1])

def __get_recipe_df(recipe_soup):
    recipe_elements = [x.text.replace('\n', ' ').replace('\r', '').replace('fl. oz.', 'fl.oz.').replace('Info', '').strip().split(' ') for x in recipe_soup.find_all('li', itemprop='recipeIngredient')]
    
    recipe_dict_list = []
    for i in range(len(recipe_elements)):
        new_item = {}
        recipe_elements[i][0] = __parse_numeric(recipe_elements[i][0])
        recipe_elements[i][1] = 'unit' if recipe_elements[i][1] == '' else recipe_elements[i][1].replace('fl.oz.', 'fluid ounce').replace('oz.', 'ounce').replace('tsp.', 'teaspoon').replace('tbsp.', 'tablespoon')
        recipe_elements[i][2] = ' '.join(recipe_elements[i][2:])
        recipe_elements[i] = recipe_elements[i][:3]
        
        new_item['qty'] = recipe_elements[i][0]
        new_item['unit'] = recipe_elements[i][1]
        new_item['item'] = recipe_elements[i][2]
        recipe_dict_list.append(new_item)
        
    df = pd.DataFrame(recipe_dict_list, columns=['qty', 'unit', 'item'])
    df = df.fillna("")
    
    return df

def __get_recipe_details(recipe_soup, url):
    recipe_details = {}
    
    recipe_details['url'] = url
    recipe_details['name'] = recipe_soup.find_all('h1')[0].text.strip()
    for soup in recipe_soup.find_all('p'):
        if soup.find('em') is not None:
            recipe_details['description'] = soup.text.strip()
            break
    recipe_details['servings'] = int(recipe_soup.find('meta', itemprop='recipeYield')['content'].split()[0])
    
    recipe_details['allergens'] = {}
    recipe_details['allergens']['immediate'] = [x.strip() for x in re.sub("[\(\[].*?[\)\]]", "", recipe_soup.find('p', {'class': 'textSm'}).text.strip().replace('\n', ' ').replace('\r', '').replace('Contains:', '')).split(',')]
    recipe_details['allergens']['secondary'] = []
    recipe_details['time'] = {}
    recipe_details['time']['total'] = recipe_soup.find_all('div', {'class': 'meal__overviewItem'})[0].text.strip().replace('\n', ' ').replace('\r', '').replace('Prep & Cook Time:', '').replace('.', '').strip().replace('min', 'minutes')
    recipe_details['time']['prep'] = ''
    recipe_details['difficulty'] = recipe_soup.find_all('div', {'class': 'meal__overviewItem'})[1].text.strip().replace('\n', ' ').replace('\r', '').replace('Difficulty Level:', '').strip()
    
    nutrition_list = [x.text.lower().strip().replace('\n', ' ').replace('\r', '').strip() for x in recipe_soup.find('ul', itemprop='nutrition').find_all('li')]
    nutrition_dict = {}
    for i in range(len(nutrition_list)):
        nutrition_dict[' '.join(nutrition_list[i].split()[:-1])] = re.sub(r"([0-9]+(\.[0-9]+)?)",r" \1 ", nutrition_list[i].split()[-1]).strip()
    if ' kcal' not in nutrition_dict['calories']:
        nutrition_dict['calories'] += ' kcal'
    recipe_details['nutrition'] = {}
    try:
        recipe_details['nutrition']['calories'] = nutrition_dict['calories']
    except:
        recipe_details['nutrition']['calories'] = ''
    try:
        recipe_details['nutrition']['fat'] = nutrition_dict['fat']
    except:
        recipe_details['nutrition']['fat'] = ''
    try:
        recipe_details['nutrition']['saturated_fat'] = nutrition_dict['saturated_fat']
    except:
        recipe_details['nutrition']['saturated_fat'] = ''
    try:
        recipe_details['nutrition']['carbohydrates'] = nutrition_dict['carbohydrates']
    except:
        recipe_details['nutrition']['carbohydrates'] = ''
    try:
        recipe_details['nutrition']['sugar'] = nutrition_dict['sugar']
    except:
        recipe_details['nutrition']['sugar'] = ''
    try:
        recipe_details['nutrition']['fiber'] = nutrition_dict['fiber']
    except:
        recipe_details['nutrition']['fiber'] = ''
    try:
        recipe_details['nutrition']['protein'] = nutrition_dict['protein']
    except:
        recipe_details['nutrition']['protein'] = ''
    try:
        recipe_details['nutrition']['cholesterol'] = nutrition_dict['cholesterol']
    except:
        recipe_details['nutrition']['cholesterol'] = ''
    try:
        recipe_details['nutrition']['sodium'] = nutrition_dict['sodium']
    except:
        recipe_details['nutrition']['sodium'] = ''
    
    return recipe_details

def get_recipe(url):
    recipe_soup = None
    try:
        recipe_soup = __get_recipe_soup(url)
    except:
        raise recipe.RecipeParseException('Invalid Recipe URL\n' + url)

    recipe_df = None
    try:
        recipe_df = __get_recipe_df(recipe_soup)
    except:
        raise recipe.RecipeParseException('Invalid Recipe URL\n' + url)

    for column in recipe_df.columns:
        if recipe_df[column].isnull().all():
            raise recipe.RecipeParseException('Invalid Recipe URL\n' + url)

    recipe_details = None
    try:
        recipe_details = __get_recipe_details(recipe_soup, url)
    except:
        raise recipe.RecipeParseException('Invalid Recipe URL\n' + url)

    to_return = recipe.Recipe(recipe_details, recipe_df)
    return to_return