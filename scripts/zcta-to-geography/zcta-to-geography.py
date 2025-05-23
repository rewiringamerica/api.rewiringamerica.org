#!/usr/bin/env python3

import argparse
import geopandas as gpd
import json
from os import path
import os
import requests
import shapely


GEOGRAPHIES_CSV_PATH = path.join(path.dirname(__file__), "../data/geographies.csv")
OUTPUT_CSV_PATH = path.join(path.dirname(__file__), "../data/zcta-to-geography.csv")
SHAPEFILES_DIR_PATH = path.join(path.dirname(__file__), "shapefiles")

GEOJSON_CRS = "EPSG:4326"
PROJECTED_CRS = "EPSG:3857"


def download_file_if_needed(url, cache_name):
    if not path.isdir(SHAPEFILES_DIR_PATH):
        os.mkdir(SHAPEFILES_DIR_PATH)

    filepath = path.join(SHAPEFILES_DIR_PATH, cache_name)

    if path.exists(filepath):
        print(f"Using cached {url}")
        return filepath

    print(f"Downloading {url}")
    with requests.get(url, stream=True) as response:
        response.raise_for_status()
        with open(filepath, "wb") as outfile:
            for chunk in response.iter_content(chunk_size=10000):
                outfile.write(chunk)

    return filepath


def geojson_to_geometry(geojson):
    if geojson:
        parsed = json.loads(geojson)
        # Shapely doesn't support reading FeatureCollections, so just turn it into
        # a GeometryCollection
        if parsed["type"] == "FeatureCollection":
            parsed["type"] = "GeometryCollection"
            parsed["geometries"] = parsed["features"]
        return shapely.geometry.shape(parsed)
    return None


# Create a GeoDataFrame of geographies.json
def get_geographies_dataframe(state_file, county_file):
    geographies = gpd.read_file(GEOGRAPHIES_CSV_PATH)

    # The "geometry" column is GeoJSON strings; we need to turn those into Shapely
    # geometry objects.
    geographies["geometry"] = geographies["geometry"].apply(geojson_to_geometry)

    # Make the IDs numeric
    geographies["id"] = geographies["id"].astype(int)

    gdf = gpd.GeoDataFrame(geographies, geometry="geometry", crs=GEOJSON_CRS).set_index(
        "id"
    )

    # Set the geometry of "state"-type rows from the states shapefile
    states = (
        gpd.read_file(state_file)
        .rename(columns={"STUSPS": "state"})
        .set_index("state")
        .to_crs(GEOJSON_CRS)
    )

    gdf.loc[gdf["type"] == "state", "geometry"] = gdf.loc[gdf["type"] == "state"].join(
        states, on="state", rsuffix="_joined"
    )["geometry_joined"]

    # Set the geometry of "county"-type rows from the counties shapefile
    counties = (
        gpd.read_file(county_file)
        .rename(columns={"GEOID": "county_fips"})
        .set_index("county_fips")
        .to_crs(GEOJSON_CRS)
    )

    gdf.loc[gdf["type"] == "county", "geometry"] = gdf.loc[
        gdf["type"] == "county"
    ].join(counties, on="county_fips", rsuffix="_joined")["geometry_joined"]

    return gdf


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zcta-file")
    parser.add_argument("--state-file")
    parser.add_argument("--county-file")
    args = parser.parse_args()

    # If you update these URLs to use files of a newer vintage, make sure to also update
    # the Geocodio calls in the JS code to request Census fields of the same vintage.
    state_file = args.state_file or download_file_if_needed(
        "https://www2.census.gov/geo/tiger/TIGER2024/STATE/tl_2024_us_state.zip",
        "state.zip",
    )
    county_file = args.county_file or download_file_if_needed(
        "https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip",
        "county.zip",
    )
    zcta_file = args.zcta_file or download_file_if_needed(
        "https://www2.census.gov/geo/tiger/TIGER2024/ZCTA520/tl_2024_us_zcta520.zip",
        "zcta.zip",
    )

    geographies = get_geographies_dataframe(state_file, county_file)
    geographies.to_crs(PROJECTED_CRS, inplace=True)
    geographies["geog_geometry"] = geographies["geometry"]

    # To compute intersection area of two geometries, we need to reproject those
    # geometries into a CRS that uses physical units of measure (meters), rather than
    # geographic coordinates.
    zctas = gpd.read_file(zcta_file).to_crs(PROJECTED_CRS)

    # The "intersects" predicate will be true for geometries that just touch each other,
    # without actually overlapping. Later we'll filter out rows where the area of the
    # intersection is zero.
    joined = gpd.sjoin(zctas, geographies, predicate="intersects")

    # Add a column that indicates how much of the ZCTA's area is within the other
    # geography. This will be used e.g. for ZCTAs that cross state lines.
    #
    # Round the intersection proportion to 6 decimal places; any intersection smaller
    # than that is likely to just be a mapping error.
    zcta_areas = joined["geometry"].area
    intersection_areas = joined["geometry"].intersection(joined["geog_geometry"]).area
    joined["intersection_proportion"] = (intersection_areas / zcta_areas).round(6)

    # Filter out empty intersections. Rename columns for CSV export.
    joined = (
        joined[joined["intersection_proportion"] != 0.0]
        .rename(columns={"ZCTA5CE20": "zcta", "id": "geography_id"})
        .sort_values(by=["zcta", "geography_id"])
    )

    joined.to_csv(
        open(OUTPUT_CSV_PATH, "w"),
        columns=["zcta", "geography_id", "intersection_proportion"],
        index=False,
        header=True,
    )


main()
