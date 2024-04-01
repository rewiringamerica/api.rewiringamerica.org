# %%
import numpy as np
import pandas as pd
import re
import pathlib

DATA_FPATH = pathlib.Path() / 'scripts' / 'income_limits' / 'data'
# %%
# --  Functions -- #


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
            .replace("  ", "_")
            .replace("'", "")
            .replace("[", "")
            .replace("]", ""))


def camel_to_snake(x: str) -> str:
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


def clean_colnames(df, convert_camel_case: bool = False):
    """Replace/remove annoying punctuation in pandas columns, and make all lowercase

    Args:
        df (pd.Dataframe or pyspark.pandas.frame.DataFrame): Dataframe with column names to be replaced
        convert_camel_case: Converts columns in CamelCase into snake_case if true

    Returns:
        pd.Dataframe or pyspark.pandas.frame.DataFrame: Dataframe of same type as df with column names replaced

    """
    if convert_camel_case:
        return df.rename(columns={c: camel_to_snake(clean_punctuation(c)) for c in df.columns})
    return df.rename(columns={c: clean_punctuation(c).lower() for c in df.columns})


def aggregate_over_origin(df, groupby_cols, agg_cols, weight_col=None, minimize_type_2_error=True):
    """
    Aggregate over the origin geography to get the income thresholds for the target geography
    using one of two strategies: 
        1. minimize the type II error: take lowest threshold of all origin geographies, 
           minimizing the chance that estimated income threshold is higher than true threshold.
        2. minimize the expected error: take the weighted average of thresholds over all geographies

    Args:
        df (pd.Dataframe): Dataframe to aggregate over
        groupby_cols (list): list of columns to groupby
        agg_cols (list): list of columns to aggregate over
        weight_col (str, optional): weight column to use if minimize_type_2_error=False. 
                                    Defaults to None.
        minimize_type_2_error (bool, optional): Whether or not to minimize type II error.
                                                Defaults to True.
    """
    def weighted_average(x, agg_cols, weight_col):
        """Calculate the weighted average for multiple columns"""
        return pd.Series(np.average(x[agg_cols], weights=x[weight_col], axis=0), agg_cols)

    if minimize_type_2_error:
        # get the minimum value for each group
        df_grouped = df.groupby(groupby_cols, as_index=False)[ami_cols].min()
    else:  # Minimize expected error
        # Calculate the weighted average over agg columns for each group
        if weight_col is None:
            raise ValueError(
                "Must pass weight_col if minimize_type_2_error = False")
        df_grouped = df.groupby(groupby_cols, as_index=False).apply(
            weighted_average,
            agg_cols=agg_cols,
            weight_col=weight_col,
            include_groups=False)
    return df_grouped


# %%
# -- Read in and clean crosswalks -- #
string_cols = ['County code', 'County subdivision (2020)']
# Read in data
tract_csub_crosswalk = clean_colnames(pd.read_csv(
    DATA_FPATH / 'raw' / 'geocorr2022_tract_to_countysub.csv',
    encoding="ISO-8859-1",
    low_memory=False,
    skiprows=1,
    dtype={col: str for col in string_cols})
)

zcta_csub_crosswalk = clean_colnames(pd.read_csv(
    DATA_FPATH / 'raw' / 'geocorr2022_zcta_to_countysub.csv',
    encoding="ISO-8859-1",
    low_memory=False,
    skiprows=1,
    dtype={col: str for col in string_cols})
)

# remove non-zctas
zcta_csub_crosswalk = zcta_csub_crosswalk[zcta_csub_crosswalk.zip_code_name != '[not in a ZCTA]']

# clean up geoids
zcta_csub_crosswalk['countysub_geoid'] = zcta_csub_crosswalk[['county_code',
                                                             'county_subdivision_2020']].agg(''.join, axis=1)
tract_csub_crosswalk['countysub_geoid'] = tract_csub_crosswalk[['county_code',
                                                               'county_subdivision_2020']].agg(''.join, axis=1)
tract_csub_crosswalk['tract_geoid'] = tract_csub_crosswalk.apply(
    lambda x: x.county_code + f"{x.tract:.2f}".replace('.', '').zfill(6), axis=1)

# %%
# -- Read in and clean AMI data -- #
string_cols = ['FIPS2010_Identifier', 'USPS_State_Code', 'County_Code']
ami_limits = pd.read_excel(
    DATA_FPATH / 'raw' / '2023_AMI_50_80_100_150_EL_from_HUD_240304_Update.xlsx',
    sheet_name=1,
    dtype={col: str for col in string_cols}
)
# in some cases, excel seems to have dropped 0 padding so need to re-pad
for col in string_cols:
    str_len = ami_limits[col].str.len().max()
    ami_limits[col] = ami_limits[col].str.zfill(str_len)
ami_limits = clean_colnames(ami_limits)

#select "base" ami columns (4 person households)
geographic_cols = ['fips2010_identifier', 'usps_state_abbr', 'hud_area_code']
ami_cols = ['2023_median_family_income'] + \
    [col for col in ami_limits.columns if 'ami_4_persons' in col]
ami_limits = ami_limits[geographic_cols + ami_cols]

# %%
# -- Join AMI to Crosswalks -- #
# pull county geoid out of county sub geoid
ami_limits['county_geoid'] = ami_limits.fips2010_identifier.apply(
    lambda x: x[0:5] if x[5:10] == '99999' else None)

# Join amis to zctas and to tracts, where new england states will match on countysub geoids
# and non-new england states will match on county geoids
# The following to not have a match in the crosswalk, and thus get dropped
# * 15 unpopulated countysubs in New England
# * Sullivan MO which is an edge case of a county sub outside New England
# TODO: add data checks?
ami_countysub_zcta_non_new_england = ami_limits.merge(
    zcta_csub_crosswalk, left_on='county_geoid', right_on='county_code', how='inner')
ami_countysub_zcta_new_england = ami_limits.merge(
    zcta_csub_crosswalk, left_on='fips2010_identifier', right_on='countysub_geoid', how='inner')
ami_countysub_zcta = pd.concat(
    [ami_countysub_zcta_non_new_england, ami_countysub_zcta_new_england])

ami_countysub_tract_non_new_england = ami_limits.merge(
    tract_csub_crosswalk, left_on='county_geoid', right_on='county_code', how='inner')
ami_countysub_tract_new_england = ami_limits.merge(
    tract_csub_crosswalk, left_on='fips2010_identifier', right_on='countysub_geoid', how='inner')
ami_countysub_tract = pd.concat(
    [ami_countysub_tract_non_new_england, ami_countysub_tract_new_england])

# %%
# -- Aggregate over countysubs to get AMI at target geography -- #
ami_by_zcta = aggregate_over_origin(
    df=ami_countysub_zcta,
    groupby_cols=['zip_census_tabulation_area', 'zip_code_name'],
    agg_cols=ami_cols)

ami_by_tract = aggregate_over_origin(
    df=ami_countysub_tract,
    groupby_cols=['tract_geoid', 'county_name', 'usps_state_abbr'],
    agg_cols=ami_cols)

# alternative strategy of minimizing expected error
# ami_by_zcta = aggregate_over_origin(
#     df = ami_csub_zcta,
#     groupby_cols=['zip_census_tabulation_area', 'zip_code_name'],
#     agg_cols=ami_cols,
#     weight_col='zcta_to_cousub20_allocation_factor',
#     minimize_type_2_error=False)
# %%
# -- Create a county metro status lookup for EV incentives  -- #
# A county resides entirely within or outside of a metro area, and if it is within
# a metro area, it will be indicated by the FMR Area prefix
ami_limits['county_geoid'] = ami_limits.fips2010_identifier.str.slice(0,5)
ami_limits['is_metro'] = ami_limits.hud_area_code.str.slice(0,5) == 'METRO'
county_metro_status = ami_limits[['county_geoid', 'is_metro']].drop_duplicates()

# %%
# -- Write out data -- #
ami_by_zcta.to_csv(DATA_FPATH / 'processed' / 'ami_by_zcta.csv', index=False)
ami_by_tract.to_csv(DATA_FPATH / 'processed' / 'ami_by_tract.csv', index=False)
county_metro_status.to_csv(DATA_FPATH / 'processed' / 'metro_status_by_county.csv', index=False)

# %%
