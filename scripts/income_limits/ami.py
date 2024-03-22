#%%
import pandas as pd
import re
import pathlib

DATA_FPATH = pathlib.Path() / 'scripts' / 'income_limits' / 'data'
# %%

# -- Cleaning Functions -- #
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

def aggregate_over_origin(df, groupby_cols, agg_cols, weight_col=None, minimize_type_2_error=True):
    """
    Aggregate over the origin geography to get the income thresholds for the target geography
    Using one of two strategies: minimize the type II error (take lowest threshold of all origin geographies) 
    and minimize the expecter error (take the weighted average of thresholds over all geographies)

    Args:
        df (pd.Dataframe): Dataframe to aggregate over
        groupby_cols (list): list of columns to groupby
        agg_cols (list): list of columns to aggregate over
        weight_col (str, optional): weight column to use if minimize_type_2_error=False. Defaults to None.
        minimize_type_2_error (bool, optional): Whether or not to minimize type II error. Defaults to True.
    """
    def weighted_average(x, agg_cols, weight_col):
        """Calculate the weighted average for multiple columns"""
        return pd.Series(np.average(x[agg_cols], weights=x[weight_col], axis=0), agg_cols)

    if minimize_type_2_error:
        df_grouped = df.groupby(groupby_cols, as_index=False)[agg_cols].min()
    else:
        if weight_col is None:
            raise ValueError("Must pass weight_col if minimize_type_2_error = False")
        df_grouped = df.groupby(groupby_cols, as_index=False).apply(
            weighted_average,
            agg_cols=agg_cols,
            weight_col=weight_col,
            include_groups=False)
    return df_grouped

# %%
# -- Read in and clean crosswalks -- #
string_cols = ['County code', 'County subdivision (2020)']

# Read in data for tract_countysub_crosswalk
tract_countysub_crosswalk = clean_colnames(
    pd.read_csv(
        DATA_FPATH / 'raw' / 'geocorr2022_tract_to_countysub.csv',
        encoding="ISO-8859-1",
        low_memory=False,
        skiprows=1,
        dtype={col: str for col in string_cols}
    )
)

# Read in data for zcta_countysub_crosswalk
zcta_countysub_crosswalk = clean_colnames(
    pd.read_csv(
        DATA_FPATH / 'raw' / 'geocorr2022_zcta_to_countysub.csv',
        encoding="ISO-8859-1",
        low_memory=False,
        skiprows=1,
        dtype={col: str for col in string_cols}
    )
)

# Remove non-zctas
zcta_countysub_crosswalk = zcta_countysub_crosswalk[zcta_countysub_crosswalk.zip_code_name != '[not in a ZCTA]']

# Clean up geoids for zcta_countysub_crosswalk
zcta_countysub_crosswalk['countysub_geoid'] = zcta_countysub_crosswalk.county_code + zcta_countysub_crosswalk.county_subdivision_2020

# Clean up geoids for tract_countysub_crosswalk
tract_countysub_crosswalk['countysub_geoid'] = tract_countysub_crosswalk.county_code + countysub_tract_crosswalk.county_subdivision_2020

# Create 'tract_geoid' column in tract_countysub_crosswalk
tract_countysub_crosswalk['tract_geoid'] = tract_countysub_crosswalk.apply(
    lambda x: x.county_code + f"{x.tract:.2f}".replace('.', '').zfill(6),
    axis=1
)

string_cols = ['FIPS2010_Identifier', 'USPS_State_Code', 'County_Code']
ami_limits = pd.read_excel(
    '/Users/mikiverma/Downloads/2023_AMI_50_80_100_150_EL_from_HUD_240304_Update.xlsx',
    sheet_name = 1,
    dtype = {col : str for col in string_cols}
)
#in some cases, excel seems to have dropped 0 padding so need to re-pad
for col in string_cols:
    str_len =  ami_limits[col].str.len().max()
    ami_limits[col] =ami_limits[col].str.zfill(str_len)
ami_limits = clean_colnames(ami_limits)

# -- Pull Crosswalks from API -- #
# %%

ami_limits['county_geoid'] = ami_limits.fips2010_identifier.apply(lambda x: x[0:5] if x[5:10] == '99999' else None)



# %%
ami_non_new_england = ami_limits.merge(county_zcta_crosswalk, left_on='county_geoid', right_on = 'county_code', indicator=True, how = 'left')
ami_non_new_england._merge.value_counts()
ami_non_new_england[ami_non_new_england._merge == 'left_only'].groupby('state_name').count()

# test_join_2 = ami_limits.merge(countysub_zcta_crosswalk, left_on='fips2010_identifier', right_on = 'countysub_geoid', indicator=True, how = 'left')
# test_join_2._merge.value_counts()
# test_join_2[test_join_2._merge == 'both'].groupby('state_name').count()



# %%
test = countysub_zcta_crosswalk.groupby(['county_code', 'zip_census_tabulation_area'], as_index=False)['zcta_to_cousub20_allocation_factor'].sum()
