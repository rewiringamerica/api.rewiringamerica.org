#%%
import pandas as pd
import requests
import re
from collections import defaultdict
# %%

HUD_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI2IiwianRpIjoiNDc1YjBhZGIwNGVjMTJmZDNmZTZjMjgyZmY4NzNkYTQxMjAzZTk5ODAxNzEyODMxNDVmZjg0MTRkNzgzZGJlMDVmYjI1ZjcwZWVlYWFkNDUiLCJpYXQiOjE3MTA1MjQ0NDEuNzYxNTA5LCJuYmYiOjE3MTA1MjQ0NDEuNzYxNTEyLCJleHAiOjIwMjYwNTcyNDEuNzU3NjgxLCJzdWIiOiI1NjkzNSIsInNjb3BlcyI6W119.POJccNCaWqVFrQJUpvH1geNLOCKh7S5tqjtW-HE9AEaZwrLGoJf-5nvUI_JEY9KFEuJEA-05zyLPqMMjDdGAEg"
HUD_API_HEADERS = {"Authorization": f"Bearer {HUD_API_KEY}"}
HUD_ENDPOINT = "https://www.huduser.gov/hudapi/public"
DATA_YEAR = 2023 #change this to run for a different data year (e.g., 2019 to match ResStock, or 2023 for GGRF)

# %%

def clean_punctuation(x):
    """Clean annoying punctuation in a string by removing or replacing with underscores or letters
 
    Args:
        x (str): string with annoying punctuation

    Returns:
        str: string without annoying punctuation
        
    """
    return (x.replace(" ", "_") 
        .replace("-", "_") 
        .replace("%", "pct") 
        .replace("?", "") 
        .replace("/", "_") 
        .replace(".", "_") 
        .replace(",", "") 
        .replace("(", "") 
        .replace(")", "") 
        .replace("$", "dollars") 
        .replace("<", "lt") 
        .replace(">", "gt") 
        .replace("#", "number") 
        .replace("-", "") 
        .replace("?", "") 
        .replace("º", "degrees") 
        .replace("°", "degrees") 
        .replace("  ","_")
        .replace("'","") 
        .replace("[", "") 
        .replace("]", ""))


def camel_to_snake(x:str) -> str:
    """Convert CamelCase strings to snake_case

    Taken from StackOverflow.
    https://stackoverflow.com/questions/1175208/elegant-python-function-to-convert-camelcase-to-snake-case
 
    Args:
        x (str): string written in CamelCase

    Returns:
        str: string in snake_case
        
    """
    x = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', x)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', x).lower()


def clean_colnames(df, convert_camel_case:bool=False):
    """Replace/remove annoying punctuation in pandas columns, and make all lowercase
 
    Args:
        df (pd.Dataframe or pyspark.pandas.frame.DataFrame): Dataframe with column names to be replaced
        convert_camel_case: Converts columns in CamelCase into snake_case if true

    Returns:
        pd.Dataframe or pyspark.pandas.frame.DataFrame: Dataframe of same type as df with column names replaced
        
    """
    if convert_camel_case:
        return df.rename(columns = {c: camel_to_snake(clean_punctuation(c)) for c in df.columns})
    return df.rename(columns = {c: clean_punctuation(c).lower() for c in df.columns})


# -- Read in data rables -- #
countysub_tract_crosswalk = clean_colnames(pd.read_csv(
    '/Users/mikiverma/Downloads/geocorr2022_2407404159.csv',  
    encoding = "ISO-8859-1", 
    low_memory=False, 
    skiprows=1,
    dtype = {'County code' : str , 'County subdivision (2020)' : str})
)

string_cols = ['FIPS2010_Identifier', 'USPS_State_Code', 'County_Code']
ami_limits = pd.read_excel(
    '/Users/mikiverma/Downloads/2023_AMI_50_80_100_150_EL_from_HUD_240304_Update.xlsx',
    sheet_name = 1,
    dtype = {col : str for col in string_cols}
)

#in some cases excel seems to have dropped 0 padding so need to re-pad
for col in string_cols:
    str_len =  ami_limits[col].str.len().max()
    ami_limits[col] =ami_limits[col].str.zfill(str_len)
ami_limits = clean_colnames(ami_limits)

# -- Pull Crosswalks from API -- #
# %%

ami_limits['is_county'] = ami_limits.fips2010_identifier.str.slice(5,10) == '99999'
state_fips_type_tuples = ami_limits[['usps_state_abbr', 'is_county']].drop_duplicates().values
assert len(state_fips_type_tuples) == ami_limits.usps_state_abbr.nunique()

def get_zip_crosswalk(state_abbr, is_county):
    if is_county: #AMI defined by county
        crosswalk_type = 2
    else: #AMI defined by countysub
        crosswalk_type = 11
    
    crosswalk_url = f"{HUD_ENDPOINT}/usps?type={crosswalk_type}&query={state_abbr}"

    response = requests.get(crosswalk_url, headers = HUD_API_HEADERS)

    if response.status_code != 200:
        print (f"Failure for {state_abbr}, see status code: {response.status_code}")
        return pd.DataFrame()
    return pd.DataFrame(response.json()["data"]["results"])	

county_countysub_zip_crosswalk_dfs = []
for state_abbr, is_county in state_fips_type_tuples:
    state_crosswalk = get_zip_crosswalk(state_abbr = state_abbr, is_county=is_county)
    county_countysub_zip_crosswalk_dfs.append(state_crosswalk)
county_countysub_zip_crosswalk = pd.concat(county_countysub_zip_crosswalk_dfs)
county_countysub_zip_crosswalk.geoid = county_countysub_zip_crosswalk.geoid.str.pad(10, 'right', '9') #pad county geoids with 9s to make it match countysub


# %%
test_join = ami_limits.merge(county_countysub_zip_crosswalk, left_on = 'fips2010_identifier', right_on = 'geoid', how = 'outer', indicator=True)
test_join._merge.value_counts()
# %%

import pandas as pd
import requests

# return a Pandas Dataframe of HUD USPS Crosswalk values

# Note that type is set to 1 which will return values for the ZIP to Tract file and query is set to VA which will return Zip Codes in Virginia
url = "https://www.huduser.gov/hudapi/public/usps?type=1&query=VA&year=2020"


response = requests.get(url, headers =HUD_API_HEADERS)

if response.status_code != 200:
	print ("Failure, see status code: {0}".format(response.status_code))
else: 
	df = pd.DataFrame(response.json()["data"]["results"])	
	print(df);

# %%

url = 'https://www.huduser.gov/hudapi/public/fmr/data/0900104720'
response = requests.get(url, headers =HUD_API_HEADERS)
response.json()

# %%
