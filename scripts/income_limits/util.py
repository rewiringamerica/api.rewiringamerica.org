import datetime
import numpy as np
import pandas as pd
import pathlib
import re
import requests
import time

# -- Globals -- #
STATE_POSTAL_TO_GEOID = {
    "AL": "01",
    "AK": "02",
    "AZ": "04",
    "AR": "05",
    "CA": "06",
    "CO": "08",
    "CT": "09",
    "DE": "10",
    "FL": "12",
    "GA": "13",
    "HI": "15",
    "ID": "16",
    "IL": "17",
    "IN": "18",
    "IA": "19",
    "KS": "20",
    "KY": "21",
    "LA": "22",
    "ME": "23",
    "MD": "24",
    "MA": "25",
    "MI": "26",
    "MN": "27",
    "MS": "28",
    "MO": "29",
    "MT": "30",
    "NE": "31",
    "NV": "32",
    "NH": "33",
    "NJ": "34",
    "NM": "35",
    "NY": "36",
    "NC": "37",
    "ND": "38",
    "OH": "39",
    "OK": "40",
    "OR": "41",
    "PA": "42",
    "RI": "44",
    "SC": "45",
    "SD": "46",
    "TN": "47",
    "TX": "48",
    "UT": "49",
    "VT": "50",
    "VA": "51",
    "WA": "53",
    "WV": "54",
    "WI": "55",
    "WY": "56",
    "DC": "11",
    "AS": "60",
    "GU": "66",
    "MP": "69",
    "PR": "72",
    "VI": "78"
}
# Note that while PR is a territory, census data for PR is stored
# with the other states and DC so it does not require special handling
TERRITORY_POSTAL_CODES = ['AS', 'GU', 'MP', 'VI']

# HUD API
HUD_API_KEY = ""
if len(HUD_API_KEY) == 0:
    raise ValueError("Add API key: stored in 1Password web developers vault")
HUD_API_HEADERS = {"Authorization": f"Bearer {HUD_API_KEY}"}
HUD_ENDPOINT = "https://www.huduser.gov/hudapi/public"

DATA_FPATH = pathlib.Path() / 'scripts' / 'income_limits' / 'data'


# -- Functions -- #
def clean_punctuation(x: str) -> str:
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


def clean_colnames(df, convert_camel_case: bool = False) -> pd.DataFrame:
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


# HUD API has a rate limit of 60 queries per min
def rate_limited_query(query_url: str, headers: dict = {}, sleep_time: int = 10) -> dict:
    """
    Poor man's rate limiting for querying an API: just sleeps for `sleep_time` seconds if the API 
    throws a "429 Too Many Request" Error. 

    Args:
        query_url (str): URL to query
        headers (dict, optional): Headers to pass to the API. Defaults to empty dict. 
        sleep_time (int, optional): number of seconds to sleep for. Defaults to 10.

    Returns:
        API response

    """
    response = requests.get(query_url, headers=headers)
    while response.status_code == 429:
        time.sleep(sleep_time)
        response = requests.get(query_url, headers=headers)
    return response


def pull_state_amis_by_countysub(
        state_postal_code: str, year: int = None, verbose: bool = False) -> pd.DataFrame:
    """
    Get AMIs for all county or countysubs within the state

    Args:
        state_postal_code (str): state two letter code
        year (int, optional): year to pull data for, must be 2021 or later. 
                        Defaults to most recent data year. 

    Returns:
        pd.Dataframe: Dataframe with one row of AMI data for each county/countysub in the state
    """
    if verbose:
        print(state_postal_code)

    list_counties_url = f"{HUD_ENDPOINT}/fmr/listCounties/{state_postal_code}"
    if year is not None:
        list_counties_url += f"?year={year}"

    response = rate_limited_query(
        query_url=list_counties_url, headers=HUD_API_HEADERS)
    state_counties = pd.DataFrame.from_records(response.json())

    countysub_geoids = state_counties.fips_code.tolist()
    # iterate thru each county/countysubs in the state and transform into dataframe
    state_amis_by_countysub = (
        pd.DataFrame
        .from_dict([pull_countysub_ami(countysub_geoid=geoid, year=year, verbose=verbose)
                    for geoid in countysub_geoids])
        .rename({'median_income': 'median_family_income'}, axis=1)
        .drop(['very_low', 'extremely_low', 'low'], axis=1)
    )

    return state_amis_by_countysub


def pull_countysub_ami(countysub_geoid: str, year: int = None, verbose: bool = False) -> pd.DataFrame:
    """
    Pull base (4 person) AMI income thresholds for a given county 

    Args:
        countysub_geoid (str): geoid of county subdivision to query. In some cases this
                               may just be a padded county geoid (e.g.,'{county_geoid}99999')
        year (int, optional): year to pull data for, must be 2021 or later. 
                        Defaults to most recent data year. 

    Returns:
        dict: AMI record

    Geoids that fail in the get request will get logged to `hud_ami_api_error_{year}.log`

    """
    county_income_limit_url = f"{HUD_ENDPOINT}/il/data/{countysub_geoid}"
    if year is not None:
        county_income_limit_url += f"?year={year}"
    response = rate_limited_query(
        query_url=county_income_limit_url, headers=HUD_API_HEADERS)
    try:
        data = response.json()['data']
        data['county_geoid'] = countysub_geoid[0:5]
        data['countysub_geoid'] = countysub_geoid
        # pull out the 4 person income threshold for each income threshold: 30, 50, and 80% AMI
        data['ami_80'] = data['low']['il80_p4']
        data['ami_50'] = data['very_low']['il50_p4']
        data['ami_30'] = data['extremely_low']['il30_p4']

    except:
        error_msg = f"{countysub_geoid} failed: {response.status_code}"
        if verbose:
            print(error_msg)
        with open(DATA_FPATH / 'processed' / f'hud_ami_api_error_{year}.log', 'a') as f:
            f.write(f"{datetime.datetime.now()} : {error_msg}\n")
        data = {}
    return data


def get_zip_crosswalk(state_abbr: str, crosswalk_type: str, year: int = None) -> pd.DataFrame:
    """Retrives crosswalk to/from zip to/from another geography. See API docs for details:
    https://www.huduser.gov/portal/dataset/uspszip-api.html

    Args:
        state_abbr (str): us state postal code
        crosswalk_type (str): crosswalk type in format {origin}-{target}. 
                              See Input parameters in API docs for options.
        year (int, optional): year to pull data for, must be 2021 or later. 
                             Defaults to most recent data year. 


    Raises:
        ValueError: if year is earlier than 2021
    Returns:
        pd.Dataframe: Crosswalk dataframe. See Response Structure in API docs for column details.
    """
    if isinstance(year, int) and year < 2021:
        raise ValueError("Year must be 2021 or later")

    crosswalk_types = [
        "zip-tract",
        "zip-county",
        "zip-cbsa",
        "zip-cbsadiv",  # (Available 4th Quarter 2017 onwards)"
        "zip-cd",
        "tract-zip",
        "county-zip",
        "cbsa-zip",
        "cbsadiv-zip",  # (Available 4th Quarter 2017 onwards)"
        "cd-zip",
        "zip-countysub",  # (Available 2nd Quarter 2018 onwards)"
        "countysub-zip"  # (Available 2nd Quarter 2018 onwards)
    ]
    type_index = crosswalk_types.index(crosswalk_type)+1
    crosswalk_url = f"{HUD_ENDPOINT}/usps?type={type_index}&query={state_abbr}"

    if year is not None:
        crosswalk_url += f"&year={year}"

    response = requests.get(crosswalk_url, headers=HUD_API_HEADERS)

    if response.status_code != 200:
        print(
            f"Failure for {state_abbr}, see status code: {response.status_code}")
        return pd.DataFrame()
    return pd.DataFrame(response.json()["data"]["results"])


def aggregate_over_origin(
        df: pd.DataFrame, groupby_cols: list, agg_cols: list, weight_col: str = None,
        minimize_type_2_error: bool = True) -> pd.DataFrame:
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
    Example: 
        ami_by_zcta = aggregate_over_origin(
            df = ami_csub_zcta,
            groupby_cols=['zcta', 'zip_code_name'],
            agg_cols=ami_cols,
            weight_col='zcta_to_cousub20_allocation_factor',
            minimize_type_2_error=False)
    """
    def weighted_average(x, agg_cols, weight_col):
        """Calculate the weighted average for multiple columns"""
        return pd.Series(np.average(x[agg_cols], weights=x[weight_col], axis=0), agg_cols)

    if minimize_type_2_error:
        # get the minimum value for each group
        df_grouped = df.groupby(groupby_cols, as_index=False)[agg_cols].min()
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
