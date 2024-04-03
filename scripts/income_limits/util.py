import re
import requests
import pandas as pd


STATE_POSTAL_TO_FIPS = {
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
