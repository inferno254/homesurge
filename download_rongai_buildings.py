import urllib.request, urllib.error, urllib.parse, json
from pathlib import Path

RONEGI_BBOX = {
    "min_lon": 36.73,
    "min_lat": -1.43,
    "max_lon": 36.81,
    "max_lat": -1.36,
}

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
QUERY = f"""
[out:json][timeout:120];
(
  way["building"]({RONEGI_BBOX['min_lat']},{RONEGI_BBOX['min_lon']},{RONEGI_BBOX['max_lat']},{RONEGI_BBOX['max_lon']});
  relation["building"]({RONEGI_BBOX['min_lat']},{RONEGI_BBOX['min_lon']},{RONEGI_BBOX['max_lat']},{RONEGI_BBOX['max_lon']});
);
out body;
>;
out skel qt;
"""

output_path = Path(__file__).parent / "rongai_buildings.geojson"
print(f"Querying Overpass for buildings in bbox: {RONEGI_BBOX}")
print("This can take 60-120 seconds for this area...")

url = OVERPASS_URL + "?data=" + urllib.parse.quote(QUERY)
req = urllib.request.Request(url, headers={"User-Agent": "homesurge-builder-script/1.0"})
with urllib.request.urlopen(req, timeout=180) as resp:
    osm_data = json.loads(resp.read())

print(f"Got {len(osm_data.get('elements', []))} OSM elements")

nodes = {}
for el in osm_data.get("elements", []):
    if el["type"] == "node":
        nodes[el["id"]] = (el["lon"], el["lat"])

features = []
for el in osm_data.get("elements", []):
    if el["type"] == "way" and "tags" in el:
        coords = []
        for nid in el.get("nodes", []):
            if nid in nodes:
                coords.append(nodes[nid])
        if len(coords) >= 3:
            # Close the polygon
            closed = coords + [coords[0]]
            features.append({
                "type": "Feature",
                "properties": {
                    "osm_id": el["id"],
                    "building": el["tags"].get("building", "yes"),
                    "height": el["tags"].get("height"),
                    "building_levels": el["tags"].get("building:levels"),
                    "name": el["tags"].get("name"),
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [closed]
                }
            })

geojson = {"type": "FeatureCollection", "features": features}
output_path.write_text(json.dumps(geojson))
print(f"Wrote {len(features)} building polygons to {output_path}")
print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")

